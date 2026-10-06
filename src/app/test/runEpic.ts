/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { lastValueFrom, of, Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { StateObservable } from 'redux-observable';
import { Epic, IRootState, IStoreDependencies } from 'modules';
import storeDependencies from 'modules/dependencies';
import mockState from './mockStore';

// Runs an epic the way the middleware does (actions in, a real StateObservable for state$)
// and resolves with everything it emitted once the input completes.
export const runEpic = (
    epic: Epic,
    actions: Action[],
    state: IRootState = mockState,
    dependencies: Partial<IStoreDependencies> = {}
) => {
    const state$ = new StateObservable<IRootState>(new Subject<IRootState>(), state);
    return lastValueFrom(
        epic(of(...actions), state$, { ...storeDependencies, ...dependencies }).pipe(toArray())
    );
};
