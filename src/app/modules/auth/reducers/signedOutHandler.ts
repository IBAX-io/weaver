/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { ISignOutReason } from '../actions';

// Kept through the sign-out (and stored, so a restart still says it), cleared by the next sign-in
const signedOutHandler = (state: State, payload: ISignOutReason): State => ({
    ...state,
    signedOutBecause: payload
});

export default signedOutHandler;
