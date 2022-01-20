/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { createWallet } from '../actions';
import { Reducer } from 'modules';

const createWalletDoneHandler: Reducer<typeof createWallet.done, State> = (state, payload) => ({
    ...state,
    isCreatingWallet: false,
    createWalletError: null
});

export default createWalletDoneHandler;