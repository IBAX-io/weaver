/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { importWallet } from '../actions';
import { Reducer } from 'modules';

const importWalletDoneHandler: Reducer<typeof importWallet.done, State> = state => ({
    ...state,
    isImportingWallet: false,
    importWalletError: null
});

export default importWalletDoneHandler;