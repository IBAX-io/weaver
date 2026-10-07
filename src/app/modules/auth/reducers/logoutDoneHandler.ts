/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { logout } from '../actions';
import { Reducer } from 'modules';

const logoutDoneHandler: Reducer<typeof logout.done, State> = (state, payload) => ({
    ...state,
    // Signed out, no account is open: the whole context goes, never half of it (an ecosystem without
    // its account passed every "is there a wallet" check and crashed whatever read the account)
    wallet: null,
    isAuthenticated: false,
    isLoggingIn: false
});

export default logoutDoneHandler;