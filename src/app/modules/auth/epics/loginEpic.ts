/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { login, acquireSession } from '../actions';
import { decryptPrivateKey } from 'lib/keyring';
import { authenticate } from 'services/auth';
import { navigate } from 'modules/router/actions';
import { UnsupportedCryptoSuiteError } from 'lib/crypto/suites';

const loginEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(login.started),
    mergeMap(action => {
        const wallet = state$.value.auth.wallet;
        const networkEndpoint = state$.value.engine.guestSession.network;
        const client = api({ apiHost: networkEndpoint.apiHost });

        return defer(() => decryptPrivateKey(wallet.wallet.encKey, action.payload.password)).pipe(
            mergeMap(privateKey => {
                if (!privateKey) {
                    return of(login.failed({
                        params: action.payload,
                        error: 'E_INVALID_PASSWORD'
                    }));
                }

                return from(authenticate(client, privateKey, {
                    ecosystem: wallet.access.ecosystem,
                    expire: 60 * 60 * 24 * 90,
                    role: wallet.role ? Number(wallet.role.id) : undefined
                })).pipe(
                    mergeMap(({ result, cryptoSuite, publicKey }) => {
                        const session = {
                            sessionToken: result.token,
                            network: networkEndpoint,
                            cryptoSuite
                        };

                        return of(
                            navigate({ to: '/' }),
                            login.done({
                                params: action.payload,
                                result: {
                                    session,
                                    privateKey,
                                    publicKey
                                }
                            }),
                            acquireSession.started(session)
                        );
                    })
                );
            }),
            catchError(e => of(login.failed({
                params: action.payload,
                error: e instanceof UnsupportedCryptoSuiteError ? 'E_UNSUPPORTED_CRYPTO' : (e && e.error) || 'E_SERVER'
            })))
        );
    })
);

export default loginEpic;
