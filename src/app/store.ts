/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action, createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { IPersistenceBackend, mergePersistedState, persistedStateChanged, selectPersistedState } from 'lib/persistence';
import createLocalStorageBackend from 'lib/persistence/localStorageBackend';

import rootReducer, { rootEpic, IRootState, IStoreDependencies } from './modules';
import platform from 'lib/platform';
import dependencies from 'modules/dependencies';

const createElectronBackend = (): IPersistenceBackend => {
  const Electron = require('electron');
  return {
    load: () => Electron.ipcRenderer.sendSync('getState') || null,
    save: state => Electron.ipcRenderer.send('setState', state)
  };
};

const persistence = platform.select<() => IPersistenceBackend>({
  web: createLocalStorageBackend,
  desktop: createElectronBackend
})();

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
    mergePersistedState(initialState, persistence.load()),
    composeEnhancers(applyMiddleware(...middleware))
  );

  let persisted = selectPersistedState(store.getState());
  store.subscribe(() => {
    const next = selectPersistedState(store.getState());
    if (persistedStateChanged(persisted, next)) {
      persisted = next;
      persistence.save(next);
    }
  });

  epicMiddleware.run(rootEpic);

  return store;
};

const store = configureStore();

export default store;
