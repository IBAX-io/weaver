/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { Action } from 'redux';
import { Subject } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { IRootState } from 'modules';
import storeDependencies from 'modules/dependencies';
import mockState from 'test/mockStore';
import { connect, reconnected, setConnected } from '../actions';
import connectEpic from './connectEpic';

// The Centrifuge client: its event handlers, fired by the test
const handlers: { [event: string]: (context?: unknown) => void } = {};
vi.mock('centrifuge', () => ({
    default: class {
        setToken() { }
        on(event: string, handler: (context?: unknown) => void) {
            handlers[event] = handler;
        }
        connect() { }
        disconnect() { }
        removeAllListeners() { }
    }
}));

const call = { wsHost: 'ws://node', session: 'token', socketToken: 'notify', timestamp: '1', userID: '7' };

describe('connectEpic', () => {
    it('tells a reconnect of the same client apart from its first connect', () => {
        const action$ = new Subject<Action>();
        const out: Action[] = [];
        const state$ = new StateObservable<IRootState>(new Subject<IRootState>(), mockState);
        const subscription = connectEpic(action$, state$, storeDependencies).subscribe(action => out.push(action));
        action$.next(connect.started(call));

        handlers.connect();
        expect(out.some(action => reconnected.match(action))).toBe(false);

        handlers.disconnect();
        handlers.connect();
        expect(out.map(action => action.type).slice(-3)).toEqual([setConnected.type, connect.done.type, reconnected.type]);
        subscription.unsubscribe();
    });
});
