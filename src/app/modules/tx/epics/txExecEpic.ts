/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat, defer, from, Observable, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, delay, filter, map, mergeMap, retry, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txExec } from '../actions';
import uuid from 'uuid';
import Contract, { IContractParam } from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import { ISignedTransaction, ITxContext, signTransaction, TTxPayload } from 'lib/tx/transaction';
import { parseAddress } from 'lib/crypto/address';
import IbaxAPI from 'lib/ibaxAPI';
import fileObservable from 'modules/io/util/fileObservable';
import { enqueueNotification } from 'modules/notifications/actions';
import { ITransaction, ITransactionBody, ITransactionCall, ITxError, TTransferCall } from 'ibax/tx';
import { IContractResponse } from 'ibax/api';

const TX_STATUS_INTERVAL = 2000;

type TContractCall = ITransactionCall['contracts'][number];
type TContractParams = TContractCall['params'][number];

// A signed transaction and what the transaction log shows for it
interface ITxJob {
  name: string;
  signed: ISignedTransaction;
  body: ITransactionBody;
}

// Same shape as an API error, so it is reported like one
const invalidTransfer = (reason: string) => ({ error: 'E_INVALID_TRANSFER', msg: reason, params: [] as string[] });

const isBaseUnits = (amount: string) => /^\d+$/.test(amount) && BigInt(amount) > 0n;

// Re-checks at the boundary what the node would reject, so a bad transfer is never signed
export const transferPayload = (transfer: TTransferCall): TTxPayload => {
  if (!isBaseUnits(transfer.amount)) {
    throw invalidTransfer(`amount "${transfer.amount}"`);
  }
  switch (transfer.type) {
    case 'utxo': {
      const toID = parseAddress(transfer.recipient);
      if (toID === null) {
        throw invalidTransfer(`recipient "${transfer.recipient}"`);
      }
      return { type: 'utxo', toID, value: transfer.amount, comment: transfer.comment };
    }
    case 'transferSelf':
      return { type: 'transferSelf', value: transfer.amount, direction: transfer.direction };
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

// The node executed the transaction and reported an error (/txstatus errmsg)
class TxExecutionError {
  constructor(readonly txError: ITxError) { }
}

class TxPending {
  constructor(readonly count: number) { }
}

// Sends a batch and polls until every transaction is in a block; an execution error stops polling
const sendBatch = (client: IbaxAPI, jobs: ITxJob[]): Observable<ITransaction[]> => {
  const request: { [hash: string]: Blob } = {};
  jobs.forEach(job => {
    request[job.signed.hash] = new Blob([job.signed.data.slice()]);
  });

  return from(client.txSend(request)).pipe(
    delay(TX_STATUS_INTERVAL),
    mergeMap(() => defer(() => client.txStatus(jobs.map(job => job.signed.hash))).pipe(
      map(status => {
        let pending = jobs.length;
        jobs.forEach(job => {
          const tx = status[job.signed.hash];
          if (tx.errmsg) {
            throw new TxExecutionError({ id: tx.errmsg.id, type: tx.errmsg.type, error: tx.errmsg.error });
          }
          else if (tx.blockid && tx.penalty === 0) {
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
        delay: error => error instanceof TxPending ? timer(TX_STATUS_INTERVAL) : throwError(() => error)
      })
    ))
  );
};

// API failures are { error, msg, params } (lib/ibaxAPI)
const isApiFailure = (error: unknown): error is { error: string; msg?: string; params?: string[] } =>
  !!error && typeof error === 'object' && typeof (error as { error?: unknown }).error === 'string';

const toTxError = (error: unknown): ITxError => {
  if (error instanceof TxExecutionError) {
    return error.txError;
  }
  if (isApiFailure(error)) {
    return { type: error.error, error: error.msg, params: error.params || [] };
  }
  return { type: 'E_SERVER', error: error instanceof Error ? error.message : String(error), params: [] };
};

export const txExecEpic: Epic = (action$, state$, { api }) => action$.pipe(
  ofAction(txExec.started),
  mergeMap(action => {
    const state = state$.value;
    const client = api({
      apiHost: state.auth.session.network.apiHost,
      sessionToken: state.auth.session.sessionToken
    });
    const privateKey = state.auth.privateKey;
    const network = state.storage.networks.find(l => l.uuid === state.auth.session.network.uuid);
    const context: ITxContext = {
      networkID: network.id,
      ecosystemID: parseInt(state.auth.wallet && state.auth.wallet.access.ecosystem || '1', 10),
      cryptoSuite: state.auth.session.cryptoSuite
    };

    // One batch per contract (all of its parameter sets), then one for the value transfers
    const batches$: Observable<ITxJob[]> = concat(
      from(action.payload.contracts).pipe(
        concatMap(contract => signContract(client, context, privateKey, contract))
      ),
      defer(() => {
        const transfers = action.payload.transfers || [];
        return transfers.length ? of(transfers.map(transfer => {
          const signed = signTransaction(context, transferPayload(transfer), privateKey);
          return { name: TRANSFER_NAMES[transfer.type], signed, body: signed.body };
        })) : of<ITxJob[]>();
      })
    );

    return batches$.pipe(
      concatMap(jobs => sendBatch(client, jobs)),
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
      )),
      catchError(error => of(txExec.failed({
        params: action.payload,
        error: toTxError(error)
      })))
    );
  })
);

export default txExecEpic;
