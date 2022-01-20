/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { saveWallet } from '../actions';
import { Reducer } from 'modules';

const saveWalletHandler: Reducer<typeof saveWallet, State> = (state, payload) => ({
    ...state,
    wallets: [
        ...state.wallets.filter(l => l.id !== payload.id),
        payload
    ]
});

export default saveWalletHandler;