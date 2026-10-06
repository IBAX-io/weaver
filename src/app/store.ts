/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'rxjs-compat';
import 'rxjs';
import 'lib/external/fsa';
import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createEpicMiddleware } from 'redux-observable';
import { IPersistenceBackend, mergePersistedState, persistedStateChanged, selectPersistedState } from 'lib/persistence';
import createLocalStorageBackend from 'lib/persistence/localStorageBackend';

import { History, createBrowserHistory, createMemoryHistory } from 'history';
import rootReducer, { rootEpic, IRootState } from './modules';
import platform from 'lib/platform';
import dependencies from 'modules/dependencies';
import { Observable } from 'rxjs';

export const history = platform.select<() => History>({
  desktop: createMemoryHistory,
  web: createBrowserHistory
})();

const createRootReducer = (hist: History) => {
  const combined = combineReducers<any>({
    ...rootReducer,
    router: connectRouter(hist)
  });
  return combined;
};

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
  const reducer = createRootReducer(history);
  const initialState = reducer(undefined, { type: '@@weaver/INIT' });
  const enhancers: any[] = [];

  const epicMiddleware = createEpicMiddleware({
    dependencies
  });

  const middleware = [
    routerMiddleware(history),
    epicMiddleware
  ];

  if (import.meta.env.DEV) {
    const devToolsExtension = (window as { devToolsExtension?: Function }).devToolsExtension;

    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension());
    }
  }

  const composedEnhancers: any = compose(
    applyMiddleware(...middleware),
    ...enhancers
  );

  const store = createStore(
    reducer,
    mergePersistedState(initialState, persistence.load()),
    composedEnhancers
  );

  let persisted = selectPersistedState(store.getState());
  store.subscribe(() => {
    const next = selectPersistedState(store.getState());
    if (persistedStateChanged(persisted, next)) {
      persisted = next;
      persistence.save(next);
    }
  });

  epicMiddleware.run(rootEpic as any);

  return store;
};

const store = configureStore();

// This is a stub value for observable store. It will be removed in the near future
const getState$ = (stateStore: typeof store) =>
  new Observable<IRootState>(observer => {
    observer.next(stateStore.getState() as any);

    const unsubscribe = store.subscribe(() => {
      observer.next(stateStore.getState() as any);
    });

    return unsubscribe;
  });

export const state$ = getState$(store);

export default store;
