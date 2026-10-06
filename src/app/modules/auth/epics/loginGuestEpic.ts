/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loginGuest } from '../actions';
import { navigate } from 'modules/router/actions';
import keyring from 'lib/keyring';
import { publicToID } from 'lib/crypto';

const loginGuestEpic: Epic = (action$, state$, { api, defaultKey, defaultPassword }) => action$.pipe(
    ofAction(loginGuest.started),
    mergeMap(action => {
        const publicKey = keyring.generatePublicKey(defaultKey);
        const network = state$.value.engine.guestSession.network;
        const client = api({ apiHost: network.apiHost });
        const id = publicToID(publicKey);

        return from(client.getUid()).pipe(
            mergeMap(uid =>
                client.authorize(uid.token).login({
                    publicKey,
                    signature: keyring.sign(uid.uid, defaultKey),
                    ecosystem: '1',
                    expire: 60 * 60 * 24 * 90,
                    role: null
                })
            ),

            // Successful authentication. Yield the result
            mergeMap(session => {
                return of(
                    navigate({ to: '/' }),
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
            }),

            // Catch actual login error, yield result
            catchError(e => of(
                loginGuest.failed({
                    params: action.payload,
                    error: e.error
                })
            ))
        );

    })
);

export default loginGuestEpic;
