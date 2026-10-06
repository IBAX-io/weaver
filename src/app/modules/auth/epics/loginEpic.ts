/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { login, acquireSession } from '../actions';
import keyring from 'lib/keyring';
import { push } from 'connected-react-router';

const loginEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(login.started),
    mergeMap(action => {
        const wallet = state$.value.auth.wallet;
        const privateKey = keyring.decryptAES(wallet.wallet.encKey, action.payload.password);
        const state = state$.value;
        const networkEndpoint = state.engine.guestSession.network;

        if (!keyring.validatePrivateKey(privateKey)) {
            return of(login.failed({
                params: action.payload,
                error: 'E_INVALID_PASSWORD'
            }));
        }

        const publicKey = keyring.generatePublicKey(privateKey);
        const client = api({ apiHost: networkEndpoint.apiHost });

        return from(client.getUid()).pipe(
            mergeMap(uid => {
                return client.authorize(uid.token).login({
                    publicKey,
                    signature: keyring.sign(uid.uid, privateKey),
                    ecosystem: wallet.access.ecosystem,
                    expire: 60 * 60 * 24 * 90,
                    role: wallet.role ? Number(wallet.role.id) : null
                });
            }),

            // Successful authentication. Yield the result
            mergeMap(response => {
                const sessionResult = {
                    sessionToken: response.token,
                    network: networkEndpoint
                };

                return of(
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
            }),

            // Catch actual login error, yield result
            catchError(e => of(
                login.failed({
                    params: action.payload,
                    error: e.error
                })
            ))
        );

    })
);

export default loginEpic;
