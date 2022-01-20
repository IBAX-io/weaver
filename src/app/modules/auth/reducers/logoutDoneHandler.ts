/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { logout } from '../actions';
import { Reducer } from 'modules';

const logoutDoneHandler: Reducer<typeof logout.done, State> = (state, payload) => ({
    ...state,
    wallet: {
        ...state.wallet,
        wallet: null
    },
    isAuthenticated: false,
    isLoggingIn: false
});

export default logoutDoneHandler;