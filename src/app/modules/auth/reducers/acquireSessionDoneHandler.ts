/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { acquireSession } from '../actions';
import { Reducer } from 'modules';

const acquireSessionDoneHandler: Reducer<typeof acquireSession.done, State> = (state, payload): State => ({
    ...state,
    isAuthenticated: payload.result,
    isAcquired: payload.result
});

export default acquireSessionDoneHandler;