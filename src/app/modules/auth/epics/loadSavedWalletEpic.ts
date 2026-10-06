/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, from } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loadWallet } from '../actions';
import { saveWallet } from 'modules/storage/actions';
import { walletAccount, walletIdentity } from '../util/walletAccount';

const loadSavedWalletEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(saveWallet),
    mergeMap(action => {
        const { network, cryptoSuite } = state$.value.engine.guestSession;
        const client = api({ apiHost: network.apiHost });

        return from(client.keyinfo({ id: walletIdentity(action.payload, cryptoSuite).keyID })).pipe(
            map(keyInfo => loadWallet(walletAccount(action.payload, cryptoSuite, keyInfo))),
            catchError(() => EMPTY)
        );
    })
);

export default loadSavedWalletEpic;
