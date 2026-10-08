/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';

// The session signed in now; null before signing in and once signed out (the session, its token
// with it, is dropped then: logoutDoneHandler). What asks the node for a signed-in user reads it
// here: an action that comes after signing out finds none and asks nothing.
export const signedInSession = (state: IRootState): ISession | null =>
    state.auth.isAuthenticated && state.auth.session ? state.auth.session : null;

// Whether the session is still the one signed in: a late answer about a session already left must
// not end the next one, nor sign out twice
export const isSignedInSession = (state: IRootState, session: ISession) => {
    const open = signedInSession(state);
    return !!open && open.sessionToken === session.sessionToken;
};
