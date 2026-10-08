/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { acquireSession } from '../actions';
import { Reducer } from 'modules';
import { isSessionRetryError } from '../util/sessionRetry';

// A node that is only unreachable for now leaves the user signed in (acquireSessionRetryEpic asks
// again); anything else ends the session
const acquireSessionFailedHandler: Reducer<typeof acquireSession.failed, State> = (state, payload): State => isSessionRetryError(payload.error)
    ? {
        ...state,
        isAcquired: false,
        sessionRetryReason: payload.error
    }
    : {
        ...state,
        isAuthenticated: false,
        isAcquired: false,
        sessionRetryReason: null
    };

export default acquireSessionFailedHandler;
