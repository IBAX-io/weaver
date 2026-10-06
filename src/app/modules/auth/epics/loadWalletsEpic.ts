/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, filter, map, mergeMap, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { cryptoSuiteKey } from 'lib/crypto/suites';
import { loadWallets } from '../actions';
import { walletAccount, walletIdentity } from '../util/walletAccount';

// Node details of every stored wallet usable on this network. A wallet whose details cannot be
// loaded is still listed (without them), so one bad request never empties the list.
const loadWalletsEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(loadWallets.started),
    mergeMap(action => {
        const state = state$.value;
        const { network, cryptoSuite } = state.engine.guestSession;
        const client = api({ apiHost: network.apiHost });

        return from(state.storage.wallets).pipe(
            filter(wallet => !!wallet.identities[cryptoSuiteKey(cryptoSuite)]),
            mergeMap(wallet =>
                from(client.keyinfo({ id: walletIdentity(wallet, cryptoSuite).keyID })).pipe(
                    map(keyInfo => walletAccount(wallet, cryptoSuite, keyInfo)),
                    catchError(() => of(walletAccount(wallet, cryptoSuite, { account: '', ecosystems: [] })))
                )
            ),
            toArray(),
            map(wallets => loadWallets.done({
                params: action.payload,
                result: wallets
            }))
        );
    })
);

export default loadWalletsEpic;
