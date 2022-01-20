/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { loginGuest } from '../actions';
import { Observable } from 'rxjs/Observable';
import { push } from 'connected-react-router';
import keyring from 'lib/keyring';
import { publicToID } from 'lib/crypto';

const loginGuestEpic: Epic = (action$, store, { api, defaultKey, defaultPassword }) => action$.ofAction(loginGuest.started)
    .flatMap(action => {
        const publicKey = keyring.generatePublicKey(defaultKey);
        const network = store.getState().engine.guestSession.network;
        const client = api({ apiHost: network.apiHost });
        const id = publicToID(publicKey);

        return Observable.from(client.getUid())
            .flatMap(uid =>
                client.authorize(uid.token).login({
                    publicKey,
                    signature: keyring.sign(uid.uid, defaultKey),
                    ecosystem: '1',
                    expire: 60 * 60 * 24 * 90,
                    role: null
                })
            )

            // Successful authentication. Yield the result
            .flatMap(session => {
                return Observable.of<Action>(
                    push('/'),
                    loginGuest.done({
                        params: action.payload,
                        result: {
                            session: {
                                sessionToken: session.token,
                                network
                            },
                            wallet: {
                                wallet: {
                                    id,
                                    address: session.account,
                                    encKey: keyring.encryptAES(defaultKey, defaultPassword),
                                    publicKey,
                                    access: [{
                                        ecosystem: '1',
                                        name: '',
                                        roles: [],
                                        notifications: []
                                    }]
                                },
                                access: {
                                    ecosystem: '1',
                                    name: '',
                                    roles: [],
                                    notifications: []
                                }
                            },
                            privateKey: defaultKey,
                            publicKey
                        }
                    })
                );
            })

            // Catch actual login error, yield result
            .catch(e => Observable.of(
                loginGuest.failed({
                    params: action.payload,
                    error: e.error
                })
            ));

    });

export default loginGuestEpic;