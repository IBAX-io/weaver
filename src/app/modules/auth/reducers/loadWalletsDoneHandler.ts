/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { loadWallets } from '../actions';
import { Reducer } from 'modules';

const loadWalletsDoneHandler: Reducer<typeof loadWallets.done, State> = (state, payload) => ({
    ...state,
    wallets: payload.result
});

export default loadWalletsDoneHandler;