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
import { cryptoSuiteKey, ICryptoSuiteId } from 'lib/crypto/suites';
import { cryptoChanged, logout } from 'modules/auth/actions';
import IbaxAPI from 'lib/ibaxAPI';
import { apiErrorCode, isApiError } from 'lib/ibaxAPI/errors';
import fileObservable from 'modules/io/util/fileObservable';
import { enqueueNotification } from 'modules/notifications/actions';
import { ITransaction, ITransactionBody, ITransactionCall, ITxError, TTransferCall, TTransferSelfDirection } from 'ibax/tx';
import { IContractResponse } from 'ibax/api';

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

// Every parameter set of a contract becomes one signed transaction; files are read first
const signContract = (client: IbaxAPI, context: ITxContext, privateKey: string, contract: TContractCall): Observable<ITxJob[]> =>
  from(client.getContract({ name: contract.name })).pipe(
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
        map(files => {
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

          const signed = new Contract({
            ...context,
            id: proto.id,
            schema: defaultSchema,
            fields: txParams
          }).sign(privateKey);

          return { name: proto.name, signed, body: { ...signed.body, Params: logParams } };
        })
      )),
      toArray()
    ))
  );

// The node executed the transaction and reported an error (/txstatus errmsg, or a penalty)
class TxExecutionError {
  constructor(readonly txError: ITxError) { }
}

// The node refused the transactions because the network's key algorithms are no longer the ones
// the session signed in under (the chain's crypto settings were changed while it was open)
class CryptoChangedError { }

class TxPending {
  constructor(readonly count: number) { }
}

const POLL_RETRY_ERRORS = ['E_HASHNOTFOUND', 'E_OFFLINE'];

// The node checks every transaction's signature when it is sent and refuses a bad one (go-ibax
// ProcessClientTxBatches: "Incorrect sign" for any other suite's signature). On a refusal the
// node is asked which algorithms it uses now: other than the session's, that is the reason;
// otherwise, or if it cannot tell, the refusal stands as it is.
const refusedSending = (client: IbaxAPI, suite: ICryptoSuiteId) => (error: unknown) => defer(() => client.getUid()).pipe(
  catchError(() => throwError(() => error)),
  mergeMap(uid => throwError(() => cryptoSuiteKey(uid.cryptoSuite) !== cryptoSuiteKey(suite) ? new CryptoChangedError() : error))
);

// Sends a batch and polls until every transaction is in a block; an execution error stops polling
const sendBatch = (client: IbaxAPI, suite: ICryptoSuiteId, jobs: ITxJob[]): Observable<ITransaction[]> => defer(() => {
  const request: { [hash: string]: Blob } = {};
  jobs.forEach(job => {
    // The same payload signed twice in the same second has one hash: the node would see one
    if (request[job.signed.hash]) {
      throw new TxExecutionError({ type: 'E_DUPLICATE_TX', error: job.signed.hash, params: [job.name] });
    }
    request[job.signed.hash] = new Blob([job.signed.data.slice()]);
  });

  return from(client.txSend(request)).pipe(
    catchError(refusedSending(client, suite)),
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
  if (isApiError(error)) {
    return { type: error.error, error: error.msg, params: error.params || [] };
  }
  return { type: 'E_SERVER', error: error instanceof Error ? error.message : String(error), params: [] };
};

export const txExecEpic: Epic = (action$, state$, { api }) => action$.pipe(
  ofAction(txExec.started),
  // Everything, the session and network lookup included, ends in txExec.done or txExec.failed
  mergeMap(action => defer(() => {
    const state = state$.value;
    const client = api({
      apiHost: state.auth.session.network.apiHost,
      sessionToken: state.auth.session.sessionToken
    });
    const privateKey = state.auth.privateKey;
    const network = state.storage.networks.find(l => l.uuid === state.auth.session.network.uuid);
    const context: ITxContext = {
      networkID: network.id,
      ecosystemID: parseInt(state.auth.wallet?.access?.ecosystem || '1', 10),
      cryptoSuite: state.auth.session.cryptoSuite
    };

    // One batch per contract (all of its parameter sets), then one for the value transfers. Every
    // batch is signed (parameters and transfers checked) before the first is sent, so a bad one
    // cannot leave the call half done.
    const batches$: Observable<ITxJob[]> = defer(() => {
      const transfers = (action.payload.transfers || []).map(transfer => ({ transfer, payload: transferPayload(transfer) }));
      return concat(
        from(action.payload.contracts).pipe(
          concatMap(contract => signContract(client, context, privateKey, contract))
        ),
        transfers.length ? defer(() => of(transfers.map(({ transfer, payload }) => {
          const signed = signTransaction(context, payload, privateKey);
          return { name: TRANSFER_NAMES[transfer.type], signed, body: signed.body };
        }))) : of<ITxJob[]>()
      );
    });

    return batches$.pipe(
      toArray(),
      concatMap(signed => from(signed)),
      concatMap(jobs => sendBatch(client, context.cryptoSuite, jobs)),
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
        cryptoChanged(),
        logout.started(null),
        txExec.failed({ params: action.payload, error: { type: 'E_CRYPTO_CHANGED', error: '', params: [] } })
      )
      : of(txExec.failed({
        params: action.payload,
        error: toTxError(error)
      })))
  ))
);

export default txExecEpic;
