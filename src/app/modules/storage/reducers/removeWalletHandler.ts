/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { removeWallet } from '../actions';
import { Reducer } from 'modules';

const removeWalletHandler: Reducer<typeof removeWallet, State> = (state, payload) => ({
    ...state,
    wallets: state.wallets.filter(l =>
        l.id !== payload.id
    )
});

export default removeWalletHandler;