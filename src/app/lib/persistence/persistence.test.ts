/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mergePersistedState, parsePersistedState, persistedStateChanged, PERSISTENCE_KEY, selectPersistedState } from '.';
import createLocalStorageBackend from './localStorageBackend';

const initial = {
    auth: { isAuthenticated: false, session: null as any, id: null as any, privateKey: '', isLoggingIn: false },
    engine: { guestSession: null as any, isLoaded: false },
    storage: { locale: 'en-US', networks: [] as any[], wallets: [] as any[] },
    content: { notifications: [] as any[] }
};

describe('persistence', () => {
    afterEach(() => vi.useRealTimers());

    it('persists only the listed keys and never the private key', () => {
        const state = { ...initial, auth: { ...initial.auth, privateKey: 'secret', id: '42' } };
        const selected = selectPersistedState(state);

        expect(selected.auth).toEqual({ isAuthenticated: false, isDefaultWallet: undefined, session: null, id: '42', wallet: undefined });
        expect(selected.auth).not.toHaveProperty('privateKey');
        expect(selected).not.toHaveProperty('content');
        expect(selected.storage).toBe(state.storage);
    });

    it('keeps non-persisted keys of a slice at their initial values when restoring', () => {
        const merged = mergePersistedState(initial, { auth: { isAuthenticated: true, id: '42' } });

        expect(merged.auth).toEqual({ ...initial.auth, isAuthenticated: true, id: '42' });
        expect(merged.content).toBe(initial.content);
    });

    it('detects changes by reference', () => {
        const before = selectPersistedState(initial);
        expect(persistedStateChanged(before, selectPersistedState({ ...initial }))).toBe(false);
        expect(persistedStateChanged(before, selectPersistedState({ ...initial, auth: { ...initial.auth, privateKey: 'x' } }))).toBe(false);
        expect(persistedStateChanged(before, selectPersistedState({ ...initial, auth: { ...initial.auth, id: '1' } }))).toBe(true);
        expect(persistedStateChanged(before, selectPersistedState({ ...initial, storage: { ...initial.storage } }))).toBe(true);
    });

    it('ignores unreadable stored data', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(parsePersistedState('{not json')).toBeNull();
        expect(parsePersistedState(null)).toBeNull();
    });

    it('debounces writes with a maximum wait', () => {
        vi.useFakeTimers();
        const storage = window.localStorage;
        storage.clear();
        const backend = createLocalStorageBackend(storage);

        backend.save({ storage: { n: 1 } });
        vi.advanceTimersByTime(900);
        backend.save({ storage: { n: 2 } });
        vi.advanceTimersByTime(900);
        expect(storage.getItem(PERSISTENCE_KEY)).toBeNull();

        vi.advanceTimersByTime(200);
        expect(JSON.parse(storage.getItem(PERSISTENCE_KEY))).toEqual({ storage: { n: 2 } });

        for (let i = 0; i < 10; i++) {
            backend.save({ storage: { n: 10 + i } });
            vi.advanceTimersByTime(600);
        }
        expect(JSON.parse(storage.getItem(PERSISTENCE_KEY)).storage.n).toBeGreaterThanOrEqual(15);
        expect(backend.load()).toEqual(JSON.parse(storage.getItem(PERSISTENCE_KEY)));
    });
});
