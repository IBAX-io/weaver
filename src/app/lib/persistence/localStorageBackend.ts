/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPersistenceBackend, parsePersistedState, PERSISTENCE_KEY, TPersistedState } from '.';

const SAVE_DELAY_MS = 1000;
const SAVE_MAX_WAIT_MS = 5000;

// Writes are debounced (with a max wait) so a burst of dispatches costs one serialization,
// and flushed when the page is hidden so the last change is not lost.
const createLocalStorageBackend = (storage: Storage = window.localStorage): IPersistenceBackend => {
    let pending: TPersistedState | null = null;
    let timer: ReturnType<typeof setTimeout> = null;
    let firstPendingAt = 0;

    const flush = () => {
        clearTimeout(timer);
        timer = null;
        if (pending) {
            storage.setItem(PERSISTENCE_KEY, JSON.stringify(pending));
            pending = null;
        }
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                flush();
            }
        });
    }

    return {
        load: () => parsePersistedState(storage.getItem(PERSISTENCE_KEY)),
        save: state => {
            const now = Date.now();
            if (!pending) {
                firstPendingAt = now;
            }
            pending = state;
            clearTimeout(timer);
            const wait = Math.min(SAVE_DELAY_MS, Math.max(0, firstPendingAt + SAVE_MAX_WAIT_MS - now));
            timer = setTimeout(flush, wait);
        }
    };
};

export default createLocalStorageBackend;
