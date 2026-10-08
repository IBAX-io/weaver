/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPersistenceBackend, TPersistedState } from '.';

const SAVE_DELAY_MS = 1000;
const SAVE_MAX_WAIT_MS = 5000;

// Writes are debounced (with a max wait) so a burst of dispatches costs one serialization, and
// flushed when the page is hidden or unloaded so the last change is not lost
const createDebouncedBackend = (load: () => TPersistedState | null, write: (state: TPersistedState) => void): IPersistenceBackend => {
    let pending: TPersistedState | null = null;
    let timer: ReturnType<typeof setTimeout> = null;
    let firstPendingAt = 0;

    const flush = () => {
        clearTimeout(timer);
        timer = null;
        if (pending) {
            write(pending);
            pending = null;
        }
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                flush();
            }
        });
        window.addEventListener('pagehide', flush);
    }

    return {
        load,
        save: (state, options) => {
            if (options && options.now) {
                pending = state;
                flush();
                return;
            }
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

export default createDebouncedBackend;
