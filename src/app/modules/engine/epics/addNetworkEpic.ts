/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { Epic } from 'modules';
import { from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { addNetwork } from '../actions';
import { navigate } from 'modules/router/actions';
import { discover } from 'services/network';
import NetworkError from 'services/network/errors';
import { saveNetwork } from 'modules/storage/actions';
import { modalShow } from 'modules/modal/actions';

const addNetworkEpic: Epic = (action$, _state$, { defaultKey }) => action$.pipe(
  ofAction(addNetwork.started),
  mergeMap(action => {
    const uniqueID = uuid.v4();

    return from(discover({ uuid: uniqueID, apiHost: action.payload.apiHost }, defaultKey, action.payload.networkID)).pipe(
      mergeMap(result => of(
        navigate({ to: '/networks' }),
        saveNetwork({
          uuid: uniqueID,
          id: result.networkID,
          honorNodes: result.honorNodes,
          name: action.payload.name,
          explorer: action.payload.explorer
        }),
        addNetwork.done(null)
      )),
      catchError((e: NetworkError) => of(
        modalShow({
          id: 'NETWORK_ERROR',
          params: {
            error: e
          },
          type: 'NETWORK_ERROR'
        }),
        addNetwork.failed({
          params: action.payload,
          error: e
        })
      ))
    );
  })
);

export default addNetworkEpic;
