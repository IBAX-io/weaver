/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { switchWallet, selectWallet, logout } from '../actions';

const switchWalletEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(switchWallet),
    mergeMap(action => {
        const state = state$.value;
        const wallet = state.auth.wallets.find(l => l.id === state.auth.wallet.wallet.id);
        const access = wallet.access.find(l => l.ecosystem === action.payload.ecosystem);

        return of(
            logout.started(null),
            selectWallet({
                wallet,
                access,
                role: action.payload.role ? access.roles.find(l => l.id === action.payload.role) : null
            })
        );
    })
);

export default switchWalletEpic;
