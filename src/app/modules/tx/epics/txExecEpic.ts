/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat, defer, from, Observable, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, delay, filter, map, mergeMap, retry, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txExec } from '../actions';
import * as uuid from 'uuid';
import Contract, { ContractParamError, IContractParam } from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import { ISignedTransaction, ITxContext, signTransaction, TTxPayload } from 'lib/tx/transaction';
import { isBaseUnits } from 'lib/tx/amount';
import { parseAddress } from 'lib/crypto/address';
import { createSigner, INodeCrypto, ISigner, sameNodeCrypto, signerErrorCode } from 'lib/crypto/signer';
import { isPkcs11Error } from 'lib/pkcs11';
import { deauthorize, E_CRYPTO_CHANGED, E_TOKENEXPIRED } from 'modules/auth/actions';
import { CryptoChangedError, signOutForCryptoChange } from 'modules/auth/util/cryptoChange';
import { isSessionExpiredError, SessionExpiredError, signOutForExpiredSession } from 'modules/auth/util/sessionExpiry';
import IbaxAPI from 'lib/ibaxAPI';
import { apiErrorCode, isApiError } from 'lib/ibaxAPI/errors';
import fileObservable from 'modules/io/util/fileObservable';
import { enqueueNotification } from 'modules/notifications/actions';
import { ITransaction, ITransactionBody, ITransactionCall, ITxError, TTransferCall, TTransferSelfDirection } from 'ibax/tx';
import { IContractResponse } from 'ibax/api';
import { signedInSession } from 'modules/auth/selectors';

const TX_STATUS_INTERVAL = 2000;
// A transaction not in a block after 3 minutes is reported instead of being polled forever
const TX_STATUS_MAX_POLLS = 90;

type TContractCall = ITransactionCall['contracts'][number];
type TContractParams = TContractCall['params'][number];

// A signed transaction and what the transaction log shows for it
interface ITxJob {
  name: string;
  signed: ISignedTransaction;
  body: ITransactionBody;
}

// A transfer that would not be accepted: refused before anything is signed or sent
class InvalidTransferError extends Error {
  constructor(readonly reason: 'amount' | 'recipient' | 'direction' | 'type') {
    super(`Invalid transfer: ${reason}`);
    this.name = 'InvalidTransferError';
  }
}

const DIRECTIONS: TTransferSelfDirection[] = ['toAccount', 'toUTXO'];

// Re-checks at the boundary what the node would reject, so a bad transfer is never signed
const transferPayload = (transfer: TTransferCall): TTxPayload => {
  if (!isBaseUnits(transfer.amount)) {
    throw new InvalidTransferError('amount');
  }
  switch (transfer.type) {
    case 'utxo': {
      const toID = parseAddress(transfer.toID);
      if (toID === null) {
        throw new InvalidTransferError('recipient');
      }
      // The node ignores the comment of a UTXO transfer (go-ibax smart.UtxoToken)
      return { type: 'utxo', toID, value: transfer.amount, comment: '' };
    }
    case 'transferSelf':
      if (!DIRECTIONS.includes(transfer.direction)) {
        throw new InvalidTransferError('direction');
      }
      return { type: 'transferSelf', value: transfer.amount, direction: transfer.direction };
    default:
      throw new InvalidTransferError('type');
  }
};

const TRANSFER_NAMES: { [K in TTransferCall['type']]: string } = {
  utxo: 'UTXO',
  transferSelf: 'TransferSelf'
};

// The node executed the transaction and reported an error (/txstatus errmsg, or a penalty)
class TxExecutionError {
  constructor(readonly txError: ITxError) { }
}

// The node checks every transaction's signature when it is sent and refuses a bad one (go-ibax
// ProcessClientTxBatches: "Incorrect sign" for any other suite's signature). When it refuses a
// send (it answered: not when it could not be reached), it is asked which algorithms it uses now
// (and whether it runs in FIPS mode): other than the session's, that is the reason (the chain's crypto settings were changed while
// the session was open; a redeployed chain also refuses the token). Otherwise a refused token
// ends the session, and any other refusal, or one the node cannot be asked about, stands as it is.
const refusedSending = (client: IbaxAPI, session: INodeCrypto) => (error: unknown) => {
  if ('E_OFFLINE' === apiErrorCode(error)) {
    return throwError(() => error);
  }
  const refused = () => isSessionExpiredError(apiErrorCode(error)) ? new SessionExpiredError('send') : error;
  return defer(() => client.getUid()).pipe(
    catchError(() => throwError(refused)),
    mergeMap(uid => throwError(() => sameNodeCrypto(uid, session) ? refused() : new CryptoChangedError('send')))
  );
};

// Every parameter set of a contract becomes one signed transaction; files are read first
const signContract = (client: IbaxAPI, context: ITxContext, session: INodeCrypto, signer: ISigner, contract: TContractCall): Observable<ITxJob[]> =>
  from(client.getContract({ name: contract.name })).pipe(
    // The token refused here already is the same as the transactions refused for it
    catchError(error => isSessionExpiredError(apiErrorCode(error)) ? refusedSending(client, session)(error) : throwError(() => error)),
    concatMap((proto: IContractResponse) => from(contract.params).pipe(
      concatMap((params: TContractParams) => from(proto.fields).pipe(
        filter(field => field.type === 'file' && !!params[field.name]),
        mergeMap(field => {
          const blob = params[field.name] as File;
          return fileObservable(blob).pipe(
            map(buffer => ({ field: field.name, name: blob.name, type: blob.type, value: buffer }))
          );
        }),
        toArray(),
        concatMap(async files => {
          const txParams: { [name: string]: IContractParam } = {};
          const logParams: { [name: string]: IContractParam } = {};

          proto.fields.forEach(field => {
            if (!params[field.name]) {
              return;
            }

            const file = files.find(f => f.field === field.name);
            txParams[field.name] = {
              type: field.type,
              value: file ? { name: file.name, type: file.type, value: file.value } : params[field.name]
            };
            logParams[field.name] = {
              type: field.type,
              value: params[field.name].toString()
            };
          });

          const signed = await new Contract({
            ...context,
            id: proto.id,
            schema: defaultSchema,
            fields: txParams
          }).sign(signer);

          return { name: proto.name, signed, body: { ...signed.body, Params: logParams } };
        })
      )),
      toArray()
    ))
  );

class TxPending {
  constructor(readonly count: number) { }
}

const POLL_RETRY_ERRORS = ['E_HASHNOTFOUND', 'E_OFFLINE'];

// Sends a batch and polls until every transaction is in a block; an execution error stops polling
const sendBatch = (client: IbaxAPI, session: INodeCrypto, jobs: ITxJob[]): Observable<ITransaction[]> => defer(() => {
  const request: { [hash: string]: Blob } = {};
  jobs.forEach(job => {
    // The same payload signed twice in the same second has one hash: the node would see one
    if (request[job.signed.hash]) {
      throw new TxExecutionError({ type: 'E_DUPLICATE_TX', error: job.signed.hash, params: [job.name] });
    }
    request[job.signed.hash] = new Blob([job.signed.data.slice()]);
  });

  return from(client.txSend(request)).pipe(
    catchError(refusedSending(client, session)),
    delay(TX_STATUS_INTERVAL),
    mergeMap(() => defer(() => client.txStatus(jobs.map(job => job.signed.hash))).pipe(
      // Right after sending, the node may not know a hash yet; a dropped connection says nothing
      // about transactions already sent: keep asking (within the same limit)
      catchError(error => throwError(() => POLL_RETRY_ERRORS.includes(apiErrorCode(error)) ? new TxPending(jobs.length) : error)),
      map(status => {
        let pending = jobs.length;
        jobs.forEach(job => {
          const tx = status[job.signed.hash];
          if (!tx) {
            return;
          }
          if (tx.errmsg) {
            throw new TxExecutionError({ id: tx.errmsg.id, type: tx.errmsg.type, error: tx.errmsg.error });
          }
          if (tx.blockid && tx.penalty !== 0) {
            throw new TxExecutionError({ type: 'E_PENALTY', error: tx.result, params: [job.name] });
          }
          if (tx.blockid) {
            pending--;
          }
        });

        if (0 === pending) {
          return jobs.map((job): ITransaction => ({
            name: job.name,
            hash: job.signed.hash,
            body: job.body,
            status: status[job.signed.hash]
          }));
        }
        else {
          throw new TxPending(pending);
        }
      }),
      retry({
        delay: (error, attempt) => {
          if (!(error instanceof TxPending)) {
            return throwError(() => error);
          }
          if (attempt >= TX_STATUS_MAX_POLLS) {
            return throwError(() => new TxExecutionError({
              type: 'E_TX_TIMEOUT',
              error: '',
              params: [String(Math.round(TX_STATUS_MAX_POLLS * TX_STATUS_INTERVAL / 60000))]
            }));
          }
          return timer(TX_STATUS_INTERVAL);
        }
      })
    ))
  );
});

// go-ibax smart eEcoCurrentBalance: "account %s current balance is not enough in ecosystem %d"
const INSUFFICIENT_BALANCE = /^account (\S+) current balance is not enough in ecosystem (\d+)$/;

const toTxError = (error: unknown): ITxError => {
  if (error instanceof TxExecutionError) {
    const balance = INSUFFICIENT_BALANCE.exec(error.txError.error || '');
    return balance
      ? { ...error.txError, type: 'E_INSUFFICIENT_BALANCE', params: [balance[1], balance[2]] }
      : error.txError;
  }
  if (error instanceof InvalidTransferError) {
    return { type: 'E_INVALID_TRANSFER', error: error.reason, params: [error.reason] };
  }
  if (error instanceof ContractParamError) {
    return {
      type: 'unsupported' === error.reason ? 'E_UNSUPPORTED_PARAM' : 'E_INVALID_PARAM',
      error: error.param,
      params: [error.param, error.paramType]
    };
  }
  const signerError = signerErrorCode(error);
  if (signerError) {
    return { type: signerError, error: error instanceof Error ? error.message : '', params: [] };
  }
  if (isApiError(error)) {
    return { type: error.error, error: error.msg, params: error.params || [] };
  }
  return { type: 'E_SERVER', error: error instanceof Error ? error.message : String(error), params: [] };
};

export const txExecEpic: Epic = (action$, state$, { api, pkcs11 }) => action$.pipe(
  ofAction(txExec.started),
  // Everything, the session and network lookup included, ends in txExec.done or txExec.failed
  mergeMap(action => {
  // The session the transactions are signed in: signed out of only if it is still the one open
  const session = signedInSession(state$.value);
  // Signed out of since they were asked for: nothing is signed or sent, nothing is shown
  if (!session) {
    return of(txExec.failed({ params: action.payload, error: { type: 'E_SIGNED_OUT', error: '', params: [] } }));
  }
  return defer(() => {
    const state = state$.value;
    const client = api({
      apiHost: session.network.apiHost,
      sessionToken: session.sessionToken
    });
    // Locked again since the call was let through (txCallEpic): nothing is signed, nothing is shown
    if (!state.auth.signingKey) {
      return of(txExec.failed({ params: action.payload, error: { type: 'E_AUTH_CANCELLED', error: '', params: [] } }));
    }
    // Throws for a key in memory on a FIPS network, or a module key where no module is reached
    const signer = createSigner(state.auth.signingKey, session.cryptoSuite, { fips: !!session.fips, pkcs11 });
    const network = state.storage.networks.find(l => l.uuid === session.network.uuid);
    const context: ITxContext = {
      networkID: network.id,
      ecosystemID: parseInt(state.auth.wallet?.access?.ecosystem || '1', 10),
      cryptoSuite: session.cryptoSuite
    };

    // One batch per contract (all of its parameter sets), then one for the value transfers. Every
    // batch is signed (parameters and transfers checked) before the first is sent, so a bad one
    // cannot leave the call half done.
    const batches$: Observable<ITxJob[]> = defer(() => {
      const transfers = (action.payload.transfers || []).map(transfer => ({ transfer, payload: transferPayload(transfer) }));
      return concat(
        from(action.payload.contracts).pipe(
          concatMap(contract => signContract(client, context, session, signer, contract))
        ),
        transfers.length ? defer(async () => {
          // One at a time: a module signs one request after another anyway
          const jobs: ITxJob[] = [];
          for (const { transfer, payload } of transfers) {
            const signed = await signTransaction(context, payload, signer);
            jobs.push({ name: TRANSFER_NAMES[transfer.type], signed, body: signed.body });
          }
          return jobs;
        }) : of<ITxJob[]>()
      );
    });

    return batches$.pipe(
      toArray(),
      concatMap(signed => from(signed)),
      concatMap(jobs => sendBatch(client, session, jobs)),
      toArray(),
      mergeMap(results => of(
        txExec.done({
          params: action.payload,
          result: ([] as ITransaction[]).concat(...results)
        }),
        enqueueNotification({
          id: uuid.v4(),
          type: 'TX_BATCH',
          params: {}
        })
      ))
    );
  }).pipe(
    catchError(error => error instanceof CryptoChangedError
      // The session ends (its address and signatures are the old algorithms'); the sign-in page
      // says why (txExecFailedEpic shows no modal for it: the sign-out would close it)
      ? of(
        txExec.failed({ params: action.payload, error: { type: E_CRYPTO_CHANGED, error: '', params: [] } }),
        ...signOutForCryptoChange(state$.value, session, error.during)
      )
      : error instanceof SessionExpiredError
        // Signed out the same way, the sign-in page says the session expired
        ? of(
          txExec.failed({ params: action.payload, error: { type: E_TOKENEXPIRED, error: '', params: [] } }),
          ...signOutForExpiredSession(state$.value, session, error.during)
        )
        : of(
          txExec.failed({
            params: action.payload,
            error: toTxError(error)
          }),
          // The token forgot the login (removed, or the module restarted): the next call asks for
          // the PIN again
          ...(isPkcs11Error(error) && 'E_PKCS11_NOT_LOGGED_IN' === error.code ? [deauthorize(null)] : [])
        ))
  );
  })
);

export default txExecEpic;
