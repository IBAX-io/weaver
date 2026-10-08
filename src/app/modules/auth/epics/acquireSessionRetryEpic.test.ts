/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { Action } from 'redux';
import { Subject } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import storeDependencies from 'modules/dependencies';
import mockState from 'test/mockStore';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { acquireSession, logout } from '../actions';
import { SESSION_RETRY_MS } from '../util/sessionRetry';
import acquireSessionRetryEpic from './acquireSessionRetryEpic';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };

// The epic running against a state the test changes as the reducers would
const running = () => {
    const action$ = new Subject<Action>();
    const state = { current: { ...mockState, auth: { ...mockState.auth, isAuthenticated: true, isAcquired: false, session } } as IRootState };
    const state$ = { get value() { return state.current; } } as StateObservable<IRootState>;
    const out: Action[] = [];
    acquireSessionRetryEpic(action$, state$, storeDependencies).subscribe(action => out.push(action));
    return { action$, state, out };
};

describe('acquireSessionRetryEpic', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('asks for the session again while the node does not answer', () => {
        const { action$, out } = running();
        action$.next(acquireSession.failed({ params: session, error: 'E_OFFLINE' }));
        vi.advanceTimersByTime(SESSION_RETRY_MS - 1);
        expect(out).toEqual([]);
        vi.advanceTimersByTime(1);
        expect(out).toEqual([acquireSession.started(session)]);
        // Each failure waits again, once
        action$.next(acquireSession.failed({ params: session, error: 'E_UPDATING' }));
        vi.advanceTimersByTime(SESSION_RETRY_MS * 3);
        expect(out).toEqual([acquireSession.started(session), acquireSession.started(session)]);
    });

    it('stops when the user signs out or asks again themselves', () => {
        const { action$, out } = running();
        action$.next(acquireSession.failed({ params: session, error: 'E_OFFLINE' }));
        action$.next(logout.started(null));
        action$.next(acquireSession.failed({ params: session, error: 'E_OFFLINE' }));
        action$.next(acquireSession.started(session));
        vi.advanceTimersByTime(SESSION_RETRY_MS * 3);
        expect(out).toEqual([]);
    });

    it('does not ask for a session that ended or was acquired meanwhile, nor after another error', () => {
        const { action$, state, out } = running();
        action$.next(acquireSession.failed({ params: session, error: 'E_TOKENEXPIRED' }));
        vi.advanceTimersByTime(SESSION_RETRY_MS);
        action$.next(acquireSession.failed({ params: session, error: 'E_OFFLINE' }));
        state.current = { ...state.current, auth: { ...state.current.auth, isAuthenticated: false } };
        vi.advanceTimersByTime(SESSION_RETRY_MS);
        action$.next(acquireSession.failed({ params: session, error: 'E_OFFLINE' }));
        state.current = { ...state.current, auth: { ...state.current.auth, isAuthenticated: true, isAcquired: true } };
        vi.advanceTimersByTime(SESSION_RETRY_MS);
        expect(out).toEqual([]);
    });
});
