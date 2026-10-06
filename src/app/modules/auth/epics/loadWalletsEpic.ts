/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loadWallets } from '../actions';
import { walletAccount, walletIdentity } from '../util/walletAccount';

const loadWalletsEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(loadWallets.started),
    mergeMap(action => {
        const state = state$.value;
        const { network, cryptoSuite } = state.engine.guestSession;
        const client = api({ apiHost: network.apiHost });

        return from(state.storage.wallets).pipe(
            mergeMap(wallet =>
                from(client.keyinfo({ id: walletIdentity(wallet, cryptoSuite).keyID })).pipe(
                    map(keyInfo => walletAccount(wallet, cryptoSuite, keyInfo))
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
