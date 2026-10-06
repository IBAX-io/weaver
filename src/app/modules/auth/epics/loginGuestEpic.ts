/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { acquireSession, loginGuest } from '../actions';
import { navigate } from 'modules/router/actions';
import { authenticate } from 'services/auth';
import { authFailureCode } from '../util/authErrors';

const GUEST_ECOSYSTEM = {
    ecosystem: '1',
    name: '',
    roles: [] as never[],
    notifications: [] as never[]
};

const loginGuestEpic: Epic = (action$, state$, { api, defaultKey }) => action$.pipe(
    ofAction(loginGuest.started),
    mergeMap(action => {
        const network = state$.value.engine.guestSession.network;
        const stored = state$.value.storage.networks.find(l => l.uuid === network.uuid);
        const client = api({ apiHost: network.apiHost });

        return defer(() => authenticate(client, defaultKey, { ecosystem: '1', expire: 60 * 60 * 24 * 90, networkID: stored && stored.id })).pipe(
            mergeMap(({ result, cryptoSuite, publicKey, keyID }) => {
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
                                    // The demo key is public and never stored or unlocked: guests cannot
                                    // sign transactions (txCallEpic) nor change a password (UserMenu)
                                    encKey: '',
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
                error: authFailureCode(e)
            })))
        );
    })
);

export default loginGuestEpic;
