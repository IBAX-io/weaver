/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { login, acquireSession } from '../actions';
import { Observable } from 'rxjs/Observable';
import keyring from 'lib/keyring';
import { push } from 'connected-react-router';

const loginEpic: Epic = (action$, store, { api }) => action$.ofAction(login.started)
    .flatMap(action => {
        const wallet = store.getState().auth.wallet;
        const privateKey = keyring.decryptAES(wallet.wallet.encKey, action.payload.password);
        const state = store.getState();
        const networkEndpoint = state.engine.guestSession.network;

        if (!keyring.validatePrivateKey(privateKey)) {
            return Observable.of(login.failed({
                params: action.payload,
                error: 'E_INVALID_PASSWORD'
            }));
        }

        const publicKey = keyring.generatePublicKey(privateKey);
        const client = api({ apiHost: networkEndpoint.apiHost });

        return Observable.from(client.getUid())
            .flatMap(uid => {
                return client.authorize(uid.token).login({
                    publicKey,
                    signature: keyring.sign(uid.uid, privateKey),
                    ecosystem: wallet.access.ecosystem,
                    expire: 60 * 60 * 24 * 90,
                    role: wallet.role ? Number(wallet.role.id) : null
                });
            })

            // Successful authentication. Yield the result
            .flatMap(response => {
                const sessionResult = {
                    sessionToken: response.token,
                    network: networkEndpoint
                };

                return Observable.of<Action>(
                    push('/'),
                    login.done({
                        params: action.payload,
                        result: {
                            session: sessionResult,
                            privateKey,
                            publicKey
                        }
                    }),
                    acquireSession.started(sessionResult)
                );
            })

            // Catch actual login error, yield result
            .catch(e => Observable.of(
                login.failed({
                    params: action.payload,
                    error: e.error
                })
            ));

    });

export default loginEpic;