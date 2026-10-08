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
    // Or: the run is finished once this action is dispatched, up to untilMs (work
    // that takes long without a sign of progress, like deriving a key, would end a quiet wait)
    until?: (action: Action) => boolean;
    // How long to wait for it at most: a failure then names what was dispatched instead
    untilMs?: number;
}

export const runEpicLoop = async (
    epic: Epic,
    actions: Action[],
    { respond = () => [], state = mockState, dependencies = {}, quietMs = 200, until, untilMs = 10000 }: IEpicLoopOptions = {}
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
    const finished = () => until ? dispatched.some(until) : Date.now() - lastActivity >= quietMs;
    const started = Date.now();
    while (!finished()) {
        if (until && Date.now() - started > untilMs) {
            subscription.unsubscribe();
            action$.complete();
            throw new Error(`runEpicLoop: the awaited action never came; dispatched: ${dispatched.map(action => action.type).join(', ')}`);
        }
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    // Whatever follows the awaited action at once is part of the run
    if (until) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    // Nothing of this run may leak into the next test
    subscription.unsubscribe();
    action$.complete();
    return dispatched;
};
