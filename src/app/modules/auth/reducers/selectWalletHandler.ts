/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { selectWallet } from '../actions';
import { Reducer } from 'modules';

const selectWalletHandler: Reducer<typeof selectWallet, State> = (state, payload) => ({
    ...state,
    wallet: payload,
    role: null,
    roles: null
});

export default selectWalletHandler;