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
import keyring from 'lib/keyring';

const initConnectEpic: Epic = (action$, state$, { api, defaultKey }) => action$.pipe(
    ofAction(discoverNetwork.done, initialize.done),
    filter(() => !!state$.value.engine.guestSession),
    mergeMap(action => {
        const state = state$.value;
        const network = state.storage.networks.find(n => n.uuid === state.engine.guestSession.network.uuid);

        if (!network) {
            return EMPTY;
        }

        const publicKey = keyring.generatePublicKey(defaultKey);
        const client = api({
            apiHost: state.engine.guestSession.network.apiHost
        });

        return from(client.getUid()).pipe(
            mergeMap(uid => client.authorize(uid.token).login({
                publicKey,
                signature: keyring.sign(uid.uid, defaultKey)
            })),
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
            catchError((e: any) => EMPTY)
        );
    })
);

export default initConnectEpic;