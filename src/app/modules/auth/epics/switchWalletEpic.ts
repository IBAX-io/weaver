/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { switchWallet, selectWallet, logout } from '../actions';
import { Observable } from 'rxjs/Observable';

const switchWalletEpic: Epic = (action$, store, { api }) => action$.ofAction(switchWallet)
    .flatMap(action => {
        const state = store.getState();
        const wallet = state.auth.wallets.find(l => l.id === state.auth.wallet.wallet.id);
        const access = wallet.access.find(l => l.ecosystem === action.payload.ecosystem);

        return Observable.of(
            logout.started(null),
            selectWallet({
                wallet,
                access,
                role: action.payload.role ? access.roles.find(l => l.id === action.payload.role) : null
            })
        );
    });

export default switchWalletEpic;