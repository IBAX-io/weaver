/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { loadWallet } from '../actions';
import { Reducer } from 'modules';

const loadWalletHandler: Reducer<typeof loadWallet, State> = (state, payload) => ({
    ...state,
    wallets: [
        ...(state.wallets || []).filter(l =>
            l.id !== payload.id
        ),
        payload
    ]
});

export default loadWalletHandler;