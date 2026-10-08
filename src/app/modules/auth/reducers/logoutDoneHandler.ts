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
    // The session goes with its token: the node cannot revoke one (go-ibax has no such endpoint;
    // a token stays valid until it expires, 90 days for one signed in here), so none is kept in the
    // state or in what is stored of it. What asks the node finds none (signedInSession).
    session: null,
    isAuthenticated: false,
    // No session is open any more: the next one is acquired anew
    isAcquired: false,
    isLoggingIn: false,
    sessionRetryReason: null
});

export default logoutDoneHandler;