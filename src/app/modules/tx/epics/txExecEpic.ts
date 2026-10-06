/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { defer, from, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, delay, filter, map, mergeMap, retry, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txExec } from '../actions';
import uuid from 'uuid';
import Contract, { IContractParam } from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import fileObservable from 'modules/io/util/fileObservable';
import { enqueueNotification } from 'modules/notifications/actions';
import { ITransactionBody } from 'ibax/tx';

const TX_STATUS_INTERVAL = 2000;

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

    return from(action.payload.contracts).pipe(
      // Contracts are serialized one at a time
      concatMap((contract: any) => from(client.getContract({ name: contract.name })).pipe(
        // ...and so are the parameter sets of each contract
        concatMap((proto: any) => from(contract.params).pipe(
          concatMap((params: any) => from(proto.fields).pipe(
            filter((l: any) => l.type === 'file' && params[l.name]),
            mergeMap((field: any) => fileObservable(params[field.name]).pipe(
              map(buffer => {
                const blob = params[field.name] as File;
                return {
                  field: field.name,
                  name: blob.name,
                  type: blob.type,
                  value: buffer,
                };
              })
            )),
            toArray(),
            mergeMap(files => {
              const txParams: { [name: string]: IContractParam } = {};
              const logParams: { [name: string]: IContractParam } = {};

              proto.fields.forEach(field => {
                if (!params[field.name]) {
                  return;
                }

                const file = files.find(f => f.field === field.name);
                txParams[field.name] = {
                  type: field.type,
                  value: file ? {
                    name: file.name,
                    type: file.type,
                    value: file.value
                  } : params[field.name]
                };
                logParams[field.name] = {
                  type: field.type,
                  value: params[field.name].toString()
                };
              });

              return from(new Contract({
                id: proto.id,
                schema: defaultSchema,
                networkID: network.id,
                ecosystemID: parseInt(state.auth.wallet && state.auth.wallet.access.ecosystem || '1', 10),
                fields: txParams
              }).sign(privateKey)).pipe(
                map(signature => ({
                  ...signature,
                  name: proto.name,
                  body: {
                    ...signature.body,
                    Params: logParams
                  }
                }))
              );
            })
          ))
        )),
        toArray(),
        concatMap(contracts => {
          const request = {};
          const jobs: {
            name: string;
            hash: string;
            body: ITransactionBody;
          }[] = [];

          contracts.forEach(signed => {
            request[signed.hash] = new Blob([signed.data]);
            jobs.push({
              name: signed.name,
              hash: signed.hash,
              body: signed.body
            });
          });

          return from(client.txSend(request)).pipe(
            delay(TX_STATUS_INTERVAL),
            mergeMap(() => defer(() => client.txStatus(contracts.map(l => l.hash))).pipe(
              map(status => {
                let pending = contracts.length;
                contracts.forEach(signed => {
                  const tx = status[signed.hash];
                  if (tx.errmsg) {
                    throw {
                      type: 'E_ERROR',
                      data: tx.errmsg
                    };
                  }
                  else if (tx.blockid && tx.penalty === 0) {
                    pending--;
                  }
                });

                if (0 === pending) {
                  return jobs.map(job => ({
                    ...job,
                    status: status[job.hash]
                  }));
                }
                else {
                  throw {
                    type: 'E_PENDING',
                    count: pending
                  };
                }
              }),
              // Poll until every transaction is in a block; a contract error stops polling
              retry({
                delay: error => {
                  switch (error.type) {
                    case 'E_PENDING':
                      return timer(TX_STATUS_INTERVAL);

                    case 'E_ERROR':
                      return throwError(() => ({
                        id: error.data.id,
                        type: error.data.type,
                        error: error.data.error,
                        params: error.data.params
                      }));

                    default:
                      return throwError(() => error);
                  }
                }
              })
            ))
          );
        })
      )),
      toArray(),
      mergeMap(results => of(
        txExec.done({
          params: action.payload,
          result: Array.prototype.concat.apply([], results)
        }),
        enqueueNotification({
          id: uuid.v4(),
          type: 'TX_BATCH',
          params: {}
        })
      )),
      catchError(error => of(txExec.failed({
        params: action.payload,
        error: error && 'id' in error ? error : {
          type: (error.errmsg ? error.errmsg.type : error.error),
          error: error.errmsg ? error.errmsg.error : error.msg,
          params: error.params || []
        }
      })))
    );
  })
);

export default txExecEpic;