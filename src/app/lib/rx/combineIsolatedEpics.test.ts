/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { Action, applyMiddleware, createStore } from 'redux';
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable';
import { config } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { combineIsolatedEpics } from './combineIsolatedEpics';

const failing: Epic<Action, Action> = action$ => action$.pipe(
    filter(a => a.type === 'BOOM' || a.type === 'PING_FAILING'),
    map(a => {
        if (a.type === 'BOOM') {
            throw new Error('boom');
        }
        return { type: 'PONG_FAILING' };
    })
);
const healthy: Epic<Action, Action> = action$ => action$.pipe(
    filter(a => a.type === 'PING'),
    map(() => ({ type: 'PONG' }))
);

const run = (rootEpic: Epic<Action, Action>) => {
    const seen: string[] = [];
    const epicMiddleware = createEpicMiddleware<Action, Action>();
    const store = createStore((state: null = null, action: Action) => {
        seen.push(action.type);
        return state;
    }, applyMiddleware(epicMiddleware));
    epicMiddleware.run(rootEpic);
    return { store, seen };
};

describe('combineIsolatedEpics', () => {
    it('keeps other epics and restarts the failing one after an uncaught error', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const { store, seen } = run(combineIsolatedEpics({ failing, healthy }));

        store.dispatch({ type: 'BOOM' });
        store.dispatch({ type: 'PING' });
        store.dispatch({ type: 'PING_FAILING' });

        expect(seen).toContain('PONG');
        expect(seen).toContain('PONG_FAILING');
        expect(console.error).toHaveBeenCalledWith('Epic "failing" failed and was restarted', expect.any(Error));
    });

    it('without isolation one failure stops every epic (control)', async () => {
        const unhandled: unknown[] = [];
        const previous = config.onUnhandledError;
        config.onUnhandledError = error => unhandled.push(error);
        try {
            const { store, seen } = run(combineEpics(failing, healthy));

            store.dispatch({ type: 'BOOM' });
            store.dispatch({ type: 'PING' });
            // RxJS reports errors without a handler on a later macrotask
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(unhandled).toHaveLength(1);
            expect(seen).not.toContain('PONG');
        }
        finally {
            config.onUnhandledError = previous;
        }
    });
});
