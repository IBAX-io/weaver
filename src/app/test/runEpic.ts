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

// Runs epics the way the store does: every emitted action is fed back into action$, so epics
// can react to each other. `respond` plays the user (e.g. answers a modal) by returning
// actions to dispatch. Resolves with everything dispatched once nothing happens anymore.
export interface IEpicLoopOptions {
    respond?: (action: Action) => Action[];
    state?: IRootState;
    dependencies?: Partial<IStoreDependencies>;
    // How long nothing may happen before the run counts as finished
    quietMs?: number;
}

export const runEpicLoop = async (
    epic: Epic,
    actions: Action[],
    { respond = () => [], state = mockState, dependencies = {}, quietMs = 200 }: IEpicLoopOptions = {}
) => {
    const action$ = new Subject<Action>();
    const dispatched: Action[] = [];
    const state$ = new StateObservable<IRootState>(new Subject<IRootState>(), state);
    let lastActivity = Date.now();
    const dispatch = (action: Action) => {
        lastActivity = Date.now();
        dispatched.push(action);
        queueMicrotask(() => {
            action$.next(action);
            respond(action).forEach(dispatch);
        });
    };
    const subscription = epic(action$, state$, { ...storeDependencies, ...dependencies }).subscribe(dispatch);
    actions.forEach(dispatch);
    while (Date.now() - lastActivity < quietMs) {
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    // Nothing of this run may leak into the next test
    subscription.unsubscribe();
    action$.complete();
    return dispatched;
};
