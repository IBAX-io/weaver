/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { createWallet } from '../actions';
import { Reducer } from 'modules';

const createWalletHandler: Reducer<typeof createWallet.started, State> = (state, payload) => ({
    ...state,
    isCreatingWallet: true,
    createWalletError: null
});

export default createWalletHandler;