/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { loginGuest } from '../actions';
import { Reducer } from 'modules';

const loginGuestFailedHandler: Reducer<typeof loginGuest.failed, State> = (state, payload) => ({
    ...state,
    isLoggingIn: false
});

export default loginGuestFailedHandler;