/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import uuid from 'uuid';
import { Epic } from 'modules';
import { Observable } from 'rxjs';
import { addNetwork, navigate } from '../actions';
import { discover } from 'services/network';
import NetworkError from 'services/network/errors';
import { saveNetwork } from 'modules/storage/actions';
import { modalShow } from 'modules/modal/actions';
import { Action } from 'redux';

const addNetworkEpic: Epic = (action$, _store, { defaultKey }) => action$.ofAction(addNetwork.started)
  .flatMap(action => {
    const uniqueID = uuid.v4();

    return Observable.from(discover({ uuid: uniqueID, apiHost: action.payload.apiHost }, defaultKey, action.payload.networkID))
      .flatMap(result => Observable.of(
        navigate('/networks'),
        saveNetwork({
          uuid: uniqueID,
          id: result.networkID,
          honorNodes: result.honorNodes,
          name: action.payload.name
        }),
        addNetwork.done(null)
      ))
      .catch((e: NetworkError) => Observable.of<Action>(
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
      ));
  });

export default addNetworkEpic;