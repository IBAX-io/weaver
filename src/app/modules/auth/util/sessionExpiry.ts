/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { E_TOKENEXPIRED, ISignOutReason, logout, sessionExpired } from '../actions';
import { isSignedInSession } from '../selectors';

// The node no longer accepts the session's token: it expired, or the node signs tokens with
// another secret now (go-ibax draws a new one at every start, so a node restart ends every
// session on it). Nothing signed in under it works any more: the session ends and the user signs
// in again. A node that does not answer says nothing about the session (sessionRetry.ts).
export const SESSION_EXPIRED_ERRORS = ['E_UNAUTHORIZED', 'E_TOKENEXPIRED'] as const;

export const isSessionExpiredError = (error: unknown) =>
    (SESSION_EXPIRED_ERRORS as readonly unknown[]).includes(error);

// The node refused the session's token, its key algorithms still the session's (a change of
// those is the reason otherwise: util/cryptoChange.ts)
export class SessionExpiredError {
    constructor(readonly during: ISignOutReason['during']) { }
}

// Signs out of a session the node no longer takes, and says so. Nothing when that session is no
// longer the one open (see signOutForCryptoChange).
export const signOutForExpiredSession = (state: IRootState, session: ISession, during: ISignOutReason['during']): Action[] =>
    isSignedInSession(state, session)
        ? [sessionExpired({ reason: E_TOKENEXPIRED, network: session.network.uuid, during }), logout.started(null)]
        : [];
