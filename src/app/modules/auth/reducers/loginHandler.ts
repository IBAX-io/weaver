/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { login } from '../actions';
import { Reducer } from 'modules';

const loginHandler: Reducer<typeof login.started, State> = (state, payload) => ({
    ...state,
    isLoggingIn: true
});

export default loginHandler;