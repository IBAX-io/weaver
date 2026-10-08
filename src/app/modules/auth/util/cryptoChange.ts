/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { cryptoChanged, E_CRYPTO_CHANGED, ISignOutReason, logout } from '../actions';
import { isSignedInSession } from '../selectors';

// The session signed in under other key algorithms than the node reports now (go-ibax /getuid
// cryptoer and hasher: what it signs and verifies with)
export class CryptoChangedError {
    constructor(readonly during: ISignOutReason['during']) { }
}

// Signs out of a session for a change of the network's key algorithms, and says so. Nothing when
// that session is no longer the one open: a late answer about a session already left must not end
// the next one, nor sign out (and connect again) twice.
export const signOutForCryptoChange = (state: IRootState, session: ISession, during: ISignOutReason['during']): Action[] =>
    isSignedInSession(state, session)
        ? [cryptoChanged({ reason: E_CRYPTO_CHANGED, network: session.network.uuid, during }), logout.started(null)]
        : [];
