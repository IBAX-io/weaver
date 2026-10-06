/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { concat, defer, from, iif, of, throwError } from 'rxjs';
import { catchError, defaultIfEmpty, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { discoverNetwork } from '../actions';
import NodeObservable from '../util/NodeObservable';
import { discover } from 'services/network';
import { mergeHonorNodes } from 'modules/storage/actions';
import NetworkError from 'services/network/errors';

const setNetworkEpic: Epic = (action$, state$, { api, defaultKey }) => action$.pipe(
  ofAction(discoverNetwork.started),
  mergeMap(action => {
    const network = state$.value.storage.networks.find(l => l.uuid === action.payload.uuid);
    if (!network) {
      return of(discoverNetwork.failed({
        params: action.payload,
        error: NetworkError.NotFound
      }));
    }

    return NodeObservable({
      nodes: network.honorNodes,
      count: 1,
      timeout: 10000,
      concurrency: 10,
      api

    }).pipe(
      defaultIfEmpty(null),
      mergeMap(node =>
        iif(
          () => null !== node,
          defer(() => from(discover({ uuid: network.uuid, apiHost: node }, defaultKey, network.id)).pipe(
            mergeMap(result => concat(
              of(discoverNetwork.done({
                params: action.payload,
                result: {
                  session: {
                    network: {
                      uuid: network.uuid,
                      apiHost: node
                    },
                    sessionToken: result.loginResult.token,
                    cryptoSuite: result.cryptoSuite
                  }
                }
              })),
              of(mergeHonorNodes({
                uuid: network.uuid,
                honorNodes: result.honorNodes
              }))
            ))
          )),
          defer(() => throwError(() => NetworkError.Offline))
        )
      ),
      catchError((error: NetworkError) => of(discoverNetwork.failed({
        params: action.payload,
        error

      })))
    );
  })
);

export default setNetworkEpic;
