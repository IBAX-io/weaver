/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The single list of state that survives a restart. Whole slices are persisted with `true`,
// otherwise only the listed keys of the slice.
export const PERSISTED_STATE = {
    storage: true,
    auth: ['isAuthenticated', 'isDefaultWallet', 'session', 'id', 'wallet', 'signedOutBecause'],
    engine: ['guestSession']
} as const;

export const PERSISTENCE_KEY = 'persistentData';

export type TPersistedState = { [slice: string]: { [key: string]: unknown } };

export interface IPersistenceBackend {
    load(): TPersistedState | null;
    // now: write at once instead of with the next batch of changes
    save(state: TPersistedState, options?: { now?: boolean }): void;
}

export const selectPersistedState = (state: { [slice: string]: any }): TPersistedState => {
    const result: TPersistedState = {};
    for (const [slice, keys] of Object.entries(PERSISTED_STATE)) {
        const value = state[slice];
        if (!value) {
            continue;
        }
        if (keys === true) {
            result[slice] = value;
        }
        else {
            result[slice] = {};
            for (const key of keys as readonly string[]) {
                result[slice][key] = value[key];
            }
        }
    }
    return result;
};

// Reducers return new references for changed values, so reference equality per persisted key
// (or per slice when the whole slice is persisted) is enough to detect a change.
// The stored wallets hold the only copy of a key the user may have just created: such a change is
// written at once, not with the next batch (a crash in between would lose the wallet)
export const storedWalletsChanged = (previous: TPersistedState, next: TPersistedState) => {
    const before = previous.storage || {};
    const after = next.storage || {};
    return before.wallets !== after.wallets || before.legacyWallets !== after.legacyWallets;
};

export const persistedStateChanged = (previous: TPersistedState, next: TPersistedState) =>
    Object.entries(PERSISTED_STATE).some(([slice, keys]) => {
        const before = previous[slice];
        const after = next[slice];
        if (keys === true || !before || !after) {
            return before !== after;
        }
        return (keys as readonly string[]).some(key => before[key] !== after[key]);
    });

// Persisted keys override the slice's initial state; keys that are not persisted keep their
// initial values instead of disappearing.
export const mergePersistedState = <S extends { [slice: string]: any }>(initial: S, persisted: TPersistedState | null): S => {
    if (!persisted) {
        return initial;
    }

    const merged: { [slice: string]: any } = { ...initial };
    for (const slice of Object.keys(PERSISTED_STATE)) {
        if (persisted[slice] && typeof persisted[slice] === 'object') {
            merged[slice] = { ...initial[slice], ...persisted[slice] };
        }
    }
    return merged as S;
};

// Whatever a backend read from storage, or null when it cannot be persisted state
export const toPersistedState = (value: unknown): TPersistedState | null =>
    value && typeof value === 'object' && !Array.isArray(value) ? value as TPersistedState : null;

export const parsePersistedState = (raw: string | null): TPersistedState | null => {
    if (!raw) {
        return null;
    }
    try {
        return toPersistedState(JSON.parse(raw));
    }
    catch (e) {
        console.error('Discarding unreadable persisted state', e);
        return null;
    }
};

const hasCryptoSuite = (session: unknown) => {
    const suite = session && 'object' === typeof session ? (session as { cryptoSuite?: { cryptoer?: unknown, hasher?: unknown } }).cryptoSuite : null;
    return !!suite && 'string' === typeof suite.cryptoer && 'string' === typeof suite.hasher;
};

// Sessions stored that cannot be used, dropped as the app starts:
// - one kept after signing out (Weaver up to 1.4 kept it, its token valid for months): dropped
// - one stored without the network's key algorithms (Weaver up to 1.4) cannot sign: the signed-in
//   one is dropped with its account (the user signs in again), the network one too (connected to
//   again at start)
export const discardStaleSessions = (persisted: TPersistedState | null): TPersistedState | null => {
    if (!persisted) {
        return persisted;
    }
    const { auth, engine } = persisted;
    const result = { ...persisted };
    if (auth && auth.session && !hasCryptoSuite(auth.session)) {
        result.auth = { ...auth, session: null, wallet: null, id: null, isAuthenticated: false, isDefaultWallet: false };
    }
    else if (auth && auth.session && true !== auth.isAuthenticated) {
        result.auth = { ...auth, session: null };
    }
    if (engine && engine.guestSession && !hasCryptoSuite(engine.guestSession)) {
        result.engine = { ...engine, guestSession: null };
    }
    return result;
};
