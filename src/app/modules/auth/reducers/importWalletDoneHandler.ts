/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { importWallet } from '../actions';
import { Reducer } from 'modules';

const importWalletDoneHandler: Reducer<typeof importWallet.done, State> = (state, payload) => ({
    ...state,
    defaultWallet: payload.params.isDefault && payload.result[0] ? payload.result[0].id : state.defaultWallet,
    isImportingWallet: false,
    importWalletError: null
});

export default importWalletDoneHandler;