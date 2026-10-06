/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action, createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { IPersistenceBackend, mergePersistedState, persistedStateChanged, selectPersistedState, storedWalletsChanged, toPersistedState } from 'lib/persistence';
import createLocalStorageBackend from 'lib/persistence/localStorageBackend';
import createDebouncedBackend from 'lib/persistence/debouncedBackend';
import { quarantineUnusableWallets } from 'modules/storage/util/storedWallets';

import rootReducer, { rootEpic, IRootState, IStoreDependencies } from './modules';
import desktop from 'lib/desktop';
import { IDesktopBridge } from 'ibax/gui';
import dependencies from 'modules/dependencies';

// The desktop app keeps the state in its config file (src/electron/ipc.ts), written before saveState returns
const createDesktopBackend = (bridge: IDesktopBridge): IPersistenceBackend => createDebouncedBackend(
  () => toPersistedState(bridge.loadState()),
  state => bridge.saveState(state)
);

const persistence = desktop ? createDesktopBackend(desktop) : createLocalStorageBackend();

const configureStore = () => {
  const reducer = combineReducers(rootReducer);
  const initialState = reducer(undefined, { type: '@@weaver/INIT' });

  const epicMiddleware = createEpicMiddleware<Action, Action, IRootState, IStoreDependencies>({
    dependencies
  });

  const middleware = [epicMiddleware];

  const composeEnhancers: typeof compose = import.meta.env.DEV
    && (window as { __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose }).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    || compose;

  const store = createStore(
    reducer,
    mergePersistedState(initialState, quarantineUnusableWallets(persistence.load())),
    composeEnhancers(applyMiddleware(...middleware))
  );

  let persisted = selectPersistedState(store.getState());
  store.subscribe(() => {
    const next = selectPersistedState(store.getState());
    if (persistedStateChanged(persisted, next)) {
      const now = storedWalletsChanged(persisted, next);
      persisted = next;
      persistence.save(next, { now });
    }
  });

  epicMiddleware.run(rootEpic);

  return store;
};

const store = configureStore();

export default store;
