/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { removeStoredWallet } from '../actions';
import { Reducer } from 'modules';

const removeWalletHandler: Reducer<typeof removeStoredWallet, State> = (state, payload) => ({
    ...state,
    wallets: state.wallets.filter(l => l.id !== payload)
});

export default removeWalletHandler;