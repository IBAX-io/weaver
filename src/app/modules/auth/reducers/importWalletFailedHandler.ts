/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { importWallet } from '../actions';
import { Reducer } from 'modules';

const importWalletFailedHandler: Reducer<typeof importWallet.failed, State> = (state, payload) => ({
    ...state,
    isImportingWallet: false,
    importWalletError: payload.error
});

export default importWalletFailedHandler;