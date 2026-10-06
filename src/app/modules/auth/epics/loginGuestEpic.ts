/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { acquireSession, loginGuest } from '../actions';
import { navigate } from 'modules/router/actions';
import { encryptPrivateKey } from 'lib/keyring';
import { authenticate } from 'services/auth';
import { UnsupportedCryptoSuiteError } from 'lib/crypto/suites';

const GUEST_ECOSYSTEM = {
    ecosystem: '1',
    name: '',
    roles: [] as never[],
    notifications: [] as never[]
};

const loginGuestEpic: Epic = (action$, state$, { api, defaultKey, defaultPassword }) => action$.pipe(
    ofAction(loginGuest.started),
    mergeMap(action => {
        const network = state$.value.engine.guestSession.network;
        const client = api({ apiHost: network.apiHost });

        return from(Promise.all([
            authenticate(client, defaultKey, { ecosystem: '1', expire: 60 * 60 * 24 * 90 }),
            encryptPrivateKey(defaultKey, defaultPassword)
        ])).pipe(
            mergeMap(([{ result, cryptoSuite, publicKey, keyID }, encKey]) => {
                const session = {
                    sessionToken: result.token,
                    network,
                    cryptoSuite
                };

                return of(
                    navigate({ to: '/' }),
                    loginGuest.done({
                        params: action.payload,
                        result: {
                            session,
                            wallet: {
                                wallet: {
                                    id: keyID,
                                    walletID: keyID,
                                    address: result.account,
                                    encKey,
                                    publicKey,
                                    access: [GUEST_ECOSYSTEM]
                                },
                                access: GUEST_ECOSYSTEM
                            },
                            privateKey: defaultKey,
                            publicKey
                        }
                    }),
                    // Like a regular login: load the ecosystem's sections, otherwise the app stays
                    // on the splash screen until a reload acquires the session
                    acquireSession.started(session)
                );
            }),
            catchError(e => of(loginGuest.failed({
                params: action.payload,
                error: e instanceof UnsupportedCryptoSuiteError ? 'E_UNSUPPORTED_CRYPTO' : (e && e.error) || 'E_SERVER'
            })))
        );
    })
);

export default loginGuestEpic;
