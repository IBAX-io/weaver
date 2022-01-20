/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { createWallet } from '../actions';
import { Reducer } from 'modules';

const createWalletFailedHandler: Reducer<typeof createWallet.failed, State> = (state, payload) => ({
    ...state,
    isCreatingWallet: false,
    createWalletError: payload.error
});

export default createWalletFailedHandler;