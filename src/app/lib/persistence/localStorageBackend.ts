/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPersistenceBackend, parsePersistedState, PERSISTENCE_KEY } from '.';
import createDebouncedBackend from './debouncedBackend';

const createLocalStorageBackend = (storage: Storage = window.localStorage): IPersistenceBackend => createDebouncedBackend(
    () => parsePersistedState(storage.getItem(PERSISTENCE_KEY)),
    state => storage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
);

export default createLocalStorageBackend;
