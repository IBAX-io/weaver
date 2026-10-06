/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { acquireSession } from '../actions';
import { Reducer } from 'modules';

const acquireSessionFailedHandler: Reducer<typeof acquireSession.failed, State> = (state): State => ({
    ...state,
    isAuthenticated: false,
    isAcquired: false
});

export default acquireSessionFailedHandler;
