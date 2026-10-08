/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, afterEach } from 'vitest';
import { discardStaleSessions, mergePersistedState, parsePersistedState, persistedStateChanged, PERSISTENCE_KEY, selectPersistedState, storedWalletsChanged, toPersistedState } from '.';
import createLocalStorageBackend from './localStorageBackend';
import createDebouncedBackend from './debouncedBackend';

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
        expect(parsePersistedState('[1,2]')).toBeNull();
        expect(parsePersistedState('"text"')).toBeNull();
    });

    it('accepts only state objects from any backend', () => {
        expect(toPersistedState({ auth: { id: '1' } })).toEqual({ auth: { id: '1' } });
        for (const value of [null, undefined, 'x', 42, [], [{ auth: {} }]]) {
            expect(toPersistedState(value)).toBeNull();
        }
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

    it('writes the last change at once when the page is hidden or closed', () => {
        vi.useFakeTimers();
        const write = vi.fn();
        const backend = createDebouncedBackend(() => null, write);

        backend.save({ storage: { n: 1 } });
        window.dispatchEvent(new Event('pagehide'));
        expect(write).toHaveBeenCalledTimes(1);
        expect(write).toHaveBeenLastCalledWith({ storage: { n: 1 } });

        backend.save({ storage: { n: 2 } });
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        visibility.mockRestore();
        expect(write).toHaveBeenCalledTimes(2);
        expect(write).toHaveBeenLastCalledWith({ storage: { n: 2 } });

        // Nothing pending: nothing more to write, and the debounce timer is gone
        window.dispatchEvent(new Event('pagehide'));
        vi.runAllTimers();
        expect(write).toHaveBeenCalledTimes(2);
    });

    it('writes a change of the stored wallets at once', () => {
        vi.useFakeTimers();
        const write = vi.fn();
        const backend = createDebouncedBackend(() => null, write);
        backend.save({ storage: { n: 1 } });
        backend.save({ storage: { n: 2, wallets: [] } }, { now: true });
        expect(write).toHaveBeenCalledTimes(1);
        expect(write).toHaveBeenLastCalledWith({ storage: { n: 2, wallets: [] } });
        vi.runAllTimers();
        expect(write).toHaveBeenCalledTimes(1);

        const wallets: unknown[] = [];
        expect(storedWalletsChanged({ storage: { wallets } }, { storage: { wallets } })).toBe(false);
        expect(storedWalletsChanged({ storage: { wallets } }, { storage: { wallets: [...wallets] } })).toBe(true);
        expect(storedWalletsChanged({ storage: { wallets, locale: 'a' } }, { storage: { wallets, locale: 'b' } })).toBe(false);
    });

    it('drops the sessions an earlier version stored without the network\'s key algorithms', () => {
        const suite = { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' };
        const network = { uuid: 'net', apiHost: 'http://node' };
        const account = { wallet: { id: '7' }, access: { ecosystem: '1' } };
        // As Weaver up to 1.4 stored them
        const old = {
            auth: { isAuthenticated: true, isDefaultWallet: false, session: { network, sessionToken: 't' }, id: '7', wallet: account },
            engine: { guestSession: { network, sessionToken: 'g' } },
            storage: { locale: 'en-US' }
        };
        expect(discardStaleSessions(old)).toEqual({
            auth: { isAuthenticated: false, isDefaultWallet: false, session: null, id: null, wallet: null },
            engine: { guestSession: null },
            storage: { locale: 'en-US' }
        });
        // Sessions with them stay as they are
        const current = {
            auth: { ...old.auth, session: { ...old.auth.session, cryptoSuite: suite } },
            engine: { guestSession: { ...old.engine.guestSession, cryptoSuite: suite } }
        };
        expect(discardStaleSessions(current)).toEqual(current);
        expect(discardStaleSessions({ auth: { session: null }, engine: {} })).toEqual({ auth: { session: null }, engine: {} });
        expect(discardStaleSessions(null)).toBeNull();
        // Signed out of, its token still stored (Weaver up to 1.4 kept it): the session goes, the
        // rest stays
        const signedOut = { ...current, auth: { ...current.auth, isAuthenticated: false, wallet: null } };
        expect(discardStaleSessions(signedOut)).toEqual({ ...signedOut, auth: { ...signedOut.auth, session: null } });
        expect(JSON.stringify(discardStaleSessions(signedOut).auth)).not.toContain('"t"');
    });

    it('drops a damaged network session, keeping the rest', () => {
        const suite = { cryptoer: 'SM2', hasher: 'SM3' };
        for (const guestSession of ['x', { cryptoSuite: suite }, { network: { uuid: 'net' }, cryptoSuite: suite }]) {
            expect(discardStaleSessions({ engine: { guestSession, other: 1 } })).toEqual({ engine: { guestSession: null, other: 1 } });
        }
    });
});
