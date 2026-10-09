/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { login, acquireSession, cryptoChanged, E_CRYPTO_CHANGED, logout } from '../actions';
import { moduleKey, Pkcs11UnavailableError, sameNodeCrypto, softwareKey, TSigningKey } from 'lib/crypto/signer';
import { decryptPrivateKey } from 'lib/keyring';
import { authenticate } from 'services/auth';
import { navigate } from 'modules/router/actions';
import { authFailureCode } from '../util/authErrors';

const loginEpic: Epic = (action$, state$, { api, pkcs11 }) => action$.pipe(
    ofAction(login.started),
    mergeMap(action => {
        const wallet = state$.value.auth.wallet;
        // The network as the account was listed on it: its algorithms then, whatever reconnects
        // while signing in
        const guest = state$.value.engine.guestSession;
        const networkEndpoint = guest.network;
        const network = state$.value.storage.networks.find(l => l.uuid === networkEndpoint.uuid);
        const client = api({ apiHost: networkEndpoint.apiHost });

        // A module wallet's password is the token's PIN: logged in to, the key signs in the module.
        // An empty one leaves the PIN to the token's own reader (protected authentication path).
        const keyRef = wallet.wallet.module;
        const unlock = async (): Promise<TSigningKey | null> => {
            if (keyRef) {
                if (!pkcs11) {
                    throw new Pkcs11UnavailableError();
                }
                await pkcs11.login(keyRef.token.serial, action.payload.password || null);
                return moduleKey(keyRef);
            }
            const privateKey = await decryptPrivateKey(wallet.wallet.encKey, action.payload.password);
            return privateKey ? softwareKey(privateKey) : null;
        };
        // Not signed in after all: the token is not left logged in
        const release = () => {
            if (keyRef && pkcs11) {
                pkcs11.logout(keyRef.token.serial).catch(() => undefined);
            }
        };

        return defer(unlock).pipe(
            mergeMap(signingKey => {
                if (!signingKey) {
                    return of(login.failed({
                        params: action.payload,
                        error: 'E_INVALID_PASSWORD'
                    }));
                }

                return from(authenticate(client, signingKey, {
                    ecosystem: wallet.access.ecosystem,
                    role: wallet.role ? Number(wallet.role.id) : undefined,
                    networkID: network && network.id,
                    pkcs11,
                    // A new key registers itself, sent with the guest's session of the same node
                    registrar: guest.sessionToken ? client.authorize(guest.sessionToken) : null
                })).pipe(
                    mergeMap(({ result, cryptoSuite, fips, publicKey }) => {
                        // The account was listed under the algorithms the network had when it was
                        // connected to: other ones now (or the network entered or left FIPS mode),
                        // its address or its signer is another (the node signed the new one in).
                        // Back to the list, connected to again; the page says why.
                        if (!sameNodeCrypto({ cryptoSuite, fips }, guest)) {
                            release();
                            return of(
                                login.failed({ params: action.payload, error: E_CRYPTO_CHANGED }),
                                cryptoChanged({ reason: E_CRYPTO_CHANGED, network: networkEndpoint.uuid, during: 'session' }),
                                logout.started(null)
                            );
                        }
                        const session = {
                            sessionToken: result.token,
                            network: networkEndpoint,
                            cryptoSuite,
                            fips
                        };

                        return of(
                            navigate({ to: '/' }),
                            login.done({
                                params: action.payload,
                                result: {
                                    session,
                                    signingKey,
                                    publicKey
                                }
                            }),
                            acquireSession.started(session)
                        );
                    })
                );
            }),
            catchError(e => {
                release();
                return of(login.failed({
                    params: action.payload,
                    error: authFailureCode(e)
                }));
            })
        );
    })
);

export default loginEpic;
