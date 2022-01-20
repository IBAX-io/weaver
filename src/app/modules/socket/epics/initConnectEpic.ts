/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs/Observable';
import { discoverNetwork, initialize } from 'modules/engine/actions';
import { connect } from '../actions';
import keyring from 'lib/keyring';

const initConnectEpic: Epic = (action$, store, { api, defaultKey }) => action$.ofType(discoverNetwork.done.type, initialize.done.type)
    .filter(() => !!store.getState().engine.guestSession)
    .flatMap(action => {
        const state = store.getState();
        const network = state.storage.networks.find(n => n.uuid === state.engine.guestSession.network.uuid);

        if (!network) {
            return Observable.empty<never>();
        }

        const publicKey = keyring.generatePublicKey(defaultKey);
        const client = api({
            apiHost: state.engine.guestSession.network.apiHost
        });

        return Observable.from(client.getUid())
            .flatMap(uid => client.authorize(uid.token).login({
                publicKey,
                signature: keyring.sign(uid.uid, defaultKey)
            }))
            .flatMap(loginResult =>
                Observable.from(client.authorize(loginResult.token).getConfig({
                    name: 'centrifugo'

                })).map(centrifugo => connect.started({
                    wsHost: network.socketUrl || centrifugo,
                    session: loginResult.token,
                    socketToken: loginResult.notify_key,
                    timestamp: loginResult.timestamp,
                    userID: loginResult.key_id
                }))
            )
            .catch((e: any) => Observable.empty<never>());
    });

export default initConnectEpic;