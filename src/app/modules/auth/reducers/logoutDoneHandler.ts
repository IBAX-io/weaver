/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { logout } from '../actions';
import { Reducer } from 'modules';

const logoutDoneHandler: Reducer<typeof logout.done, State> = (state, payload) => ({
    ...state,
    // The ecosystem and roles stay for the next sign-in; without a context there is nothing to keep
    wallet: state.wallet ? { ...state.wallet, wallet: null } : null,
    isAuthenticated: false,
    isLoggingIn: false
});

export default logoutDoneHandler;