/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { login } from '../actions';
import { Reducer } from 'modules';

const loginFailedHandler: Reducer<typeof login.failed, State> = (state, payload) => ({
    ...state,
    isLoggingIn: false
});

export default loginFailedHandler;