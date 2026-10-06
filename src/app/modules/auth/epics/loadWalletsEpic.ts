/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loadWallets } from '../actions';

const loadWalletsEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(loadWallets.started),
    mergeMap(action => {
        const state = state$.value;
        const network = state$.value.engine.guestSession.network;
        const client = api({ apiHost: network.apiHost });

        return from(state.storage.wallets).pipe(
            mergeMap(wallet =>
                from(client.keyinfo({
                    id: wallet.id
                })).pipe(
                    map(keyInfo => ({
                        id: wallet.id,
                        address: keyInfo.account,
                        encKey: wallet.encKey,
                        publicKey: wallet.publicKey,
                        access: keyInfo.ecosystems.map(key => ({
                            ...key,
                            roles: key.roles || []
                        }))
                    }))
                )
            ),
            toArray(),
            map(wallets => loadWallets.done({
                params: action.payload,
                result: wallets

            })),
            catchError(e => of(loadWallets.failed({
                params: action.payload,
                error: e
            })))
        );
    })
);

export default loadWalletsEpic;
