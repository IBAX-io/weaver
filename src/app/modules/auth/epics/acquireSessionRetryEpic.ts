/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { timer } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { acquireSession, logout } from '../actions';
import { isSessionRetryError, SESSION_RETRY_MS } from '../util/sessionRetry';

// A restored session the node could not be asked about is asked for again until the node answers,
// the user asks again themselves or signs out
const acquireSessionRetryEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(acquireSession.failed),
    filter(action => isSessionRetryError(action.payload.error)),
    switchMap(action => timer(SESSION_RETRY_MS).pipe(
        takeUntil(action$.pipe(ofAction(acquireSession.started, logout.started))),
        filter(() => state$.value.auth.isAuthenticated && !state$.value.auth.isAcquired),
        map(() => acquireSession.started(action.payload.params))
    ))
);

export default acquireSessionRetryEpic;
