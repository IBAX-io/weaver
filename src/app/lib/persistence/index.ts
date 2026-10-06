/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The single list of state that survives a restart. Whole slices are persisted with `true`,
// otherwise only the listed keys of the slice.
export const PERSISTED_STATE = {
    storage: true,
    auth: ['isAuthenticated', 'isDefaultWallet', 'session', 'id', 'wallet'],
    engine: ['guestSession']
} as const;

export const PERSISTENCE_KEY = 'persistentData';

export type TPersistedState = { [slice: string]: { [key: string]: unknown } };

export interface IPersistenceBackend {
    load(): TPersistedState | null;
    save(state: TPersistedState): void;
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
