/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { EMPTY, from } from 'rxjs';
import { catchError, filter, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { discoverNetwork, initialize } from 'modules/engine/actions';
import { connect } from '../actions';
import { acquireSession } from 'modules/auth/actions';
import { authenticateGuest } from 'services/auth';

const initConnectEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(discoverNetwork.done, initialize.done, acquireSession.done),
    filter(action => {
        const state = state$.value;
        if (!state.engine.guestSession) {
            return false;
        }
        // Signed out, the network is discovered again at start (connectDefaultEpic): connected then
        if (initialize.done.match(action)) {
            return state.auth.isAuthenticated;
        }
        // A session restored once the node answered again, which it did not at start
        if (acquireSession.done.match(action)) {
            return !state.socket.socket;
        }
        return true;
    }),
    mergeMap(action => {
        const state = state$.value;
        const network = state.storage.networks.find(n => n.uuid === state.engine.guestSession.network.uuid);

        if (!network) {
            return EMPTY;
        }

        const client = api({
            apiHost: state.engine.guestSession.network.apiHost
        });

        return from(authenticateGuest(client, { networkID: network.id })).pipe(
            map(({ result }) => result),
            mergeMap(loginResult =>
                from(client.authorize(loginResult.token).getConfig({
                    name: 'centrifugo'

                })).pipe(map(centrifugo => connect.started({
                    wsHost: network.socketUrl || centrifugo,
                    session: loginResult.token,
                    socketToken: loginResult.notify_key,
                    timestamp: loginResult.timestamp,
                    userID: loginResult.key_id
                })))
            ),
            catchError(() => EMPTY)
        );
    })
);

export default initConnectEpic;