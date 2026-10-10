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
import { connect, notificationsReceived, reconnected, setConnected } from '../actions';
import connectEpic from './connectEpic';

// The Centrifuge client: how it was created, and its event handlers, fired by the test
const created: { endpoint: string, options: unknown }[] = [];
const handlers: { [event: string]: (context?: unknown) => void } = {};
vi.mock('centrifuge', () => ({
    Centrifuge: class {
        constructor(endpoint: string, options: unknown) {
            created.push({ endpoint, options });
        }
        on(event: string, handler: (context?: unknown) => void) {
            handlers[event] = handler;
        }
        connect() { }
        disconnect() { }
        removeAllListeners() { }
    }
}));

const call = { url: 'ws://centrifugo', token: 'notify', session: 'token' };

const start = () => {
    const action$ = new Subject<Action>();
    const out: Action[] = [];
    const state$ = new StateObservable<IRootState>(new Subject<IRootState>(), mockState);
    const subscription = connectEpic(action$, state$, storeDependencies).subscribe(action => out.push(action));
    action$.next(connect.started(call));
    return { out, stop: () => subscription.unsubscribe() };
};

describe('connectEpic', () => {
    it('connects with the session\'s token and subscribes to nothing', () => {
        const { stop } = start();
        expect(created.at(-1)).toEqual({ endpoint: 'ws://centrifugo/connection/websocket', options: { token: 'notify' } });
        stop();
    });

    it('tells a reconnect of the same client apart from its first connect', () => {
        const { out, stop } = start();

        handlers.connected();
        expect(out.some(action => reconnected.match(action))).toBe(false);

        handlers.connecting();
        handlers.connected();
        expect(out.map(action => action.type).slice(-3)).toEqual([setConnected.type, connect.done.type, reconnected.type]);
        stop();
    });

    it('passes on what the account\'s channel publishes', () => {
        const { out, stop } = start();
        const counts = [{ ecosystem: '1', role_id: '0', count: 2 }];

        handlers.publication({ channel: 'client#1234', data: counts });
        expect(out.at(-1)).toEqual(notificationsReceived(counts));
        stop();
    });
});
