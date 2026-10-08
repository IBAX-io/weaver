/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { login, acquireSession, cryptoChanged, E_CRYPTO_CHANGED, logout } from '../actions';
import { sameCryptoSuite } from 'lib/crypto/suites';
import { decryptPrivateKey } from 'lib/keyring';
import { authenticate } from 'services/auth';
import { navigate } from 'modules/router/actions';
import { authFailureCode } from '../util/authErrors';

const loginEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(login.started),
    mergeMap(action => {
        const wallet = state$.value.auth.wallet;
        // The network as the account was listed on it: its algorithms then, whatever reconnects
        // while signing in
        const guest = state$.value.engine.guestSession;
        const networkEndpoint = guest.network;
        const network = state$.value.storage.networks.find(l => l.uuid === networkEndpoint.uuid);
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
                    role: wallet.role ? Number(wallet.role.id) : undefined,
                    networkID: network && network.id
                })).pipe(
                    mergeMap(({ result, cryptoSuite, publicKey }) => {
                        // The account was listed under the algorithms the network had when it was
                        // connected to: other ones now, its address is another (the node signed
                        // the new one in). Back to the list, connected to again; the page says why.
                        if (!sameCryptoSuite(cryptoSuite, guest.cryptoSuite)) {
                            return of(
                                login.failed({ params: action.payload, error: E_CRYPTO_CHANGED }),
                                cryptoChanged({ reason: E_CRYPTO_CHANGED, network: networkEndpoint.uuid, during: 'session' }),
                                logout.started(null)
                            );
                        }
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
                error: authFailureCode(e)
            })))
        );
    })
);

export default loginEpic;
