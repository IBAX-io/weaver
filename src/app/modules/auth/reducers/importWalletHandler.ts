/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { importWallet } from '../actions';
import { Reducer } from 'modules';

const importWalletHandler: Reducer<typeof importWallet.started, State> = (state, payload) => ({
    ...state,
    isImportingWallet: true,
    importWalletError: null
});

export default importWalletHandler;