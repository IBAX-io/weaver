/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The client as the app runs it, without the UI: the real reducers, epics and dependencies (API,
// keyring, Centrifuge), started from persisted state the way store.ts does, and served the given
// settings (appConfig.ts, which the test file mocks ConfigObservable with). The test plays the
// user by dispatching what the pages dispatch and answering the dialogs the epics open. Closing
// and starting again from what it persisted is a restart of the app.
import { Action, AnyAction, applyMiddleware, combineReducers, createStore, Middleware, Store } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import rootReducer, { IRootState, IStoreDependencies, rootEpic } from 'modules';
import { IPkcs11 } from 'ibax/pkcs11';
import dependencies from 'modules/dependencies';
import { mergePersistedState, selectPersistedState, TPersistedState } from 'lib/persistence';
import { restorePersistedState } from 'modules/restorePersistedState';
import { initialize } from 'modules/engine/actions';
import { modalClose, modalShow } from 'modules/modal/actions';
import { selectScreen, TScreen } from 'containers/appScreen';
import { ISettings, serveSettings } from './appConfig';

// What the user answers to a dialog, if anything: its result data
export type TDialogAnswer = (modal: ReturnType<typeof modalShow>['payload']) => { data: unknown } | undefined;

export interface IClient {
    settings: ISettings;
    store: Store<IRootState, AnyAction>;
    // Every action dispatched since the start, in order
    actions: Action[];
    // The paths the app navigated to
    navigations: string[];
    screen(): TScreen;
    // What the app would find at its next start
    persisted(): TPersistedState;
    dispatch(action: Action): void;
    // Resolves once the state satisfies the condition (checked after every action and every 100 ms)
    waitFor(condition: (state: IRootState) => boolean, what: string, timeout?: number): Promise<IRootState>;
    // Resolves with the first action from index `from` on that matches
    waitForAction<A extends Action>(match: (action: Action) => action is A, what: string, from?: number, timeout?: number): Promise<A>;
    // The app quits: every epic stops, the socket is closed
    close(): void;
}

// Action types, with the error of a failed one
export const describeActions = (actions: Action[]) => actions
    .map(action => {
        const error = (action as AnyAction).payload?.error;
        return undefined === error ? action.type : `${action.type}(${JSON.stringify(error)})`;
    })
    .join(', ');

export interface IClientOptions {
    settings: ISettings;
    // What an earlier start stored; none on the first start
    persisted?: TPersistedState | null;
    answer?: TDialogAnswer;
    // Module access, as the desktop app has it (see softToken)
    pkcs11?: IPkcs11 | null;
}

export const startClient = ({ settings, persisted = null, answer = () => undefined, pkcs11 = null }: IClientOptions): IClient => {
    serveSettings(settings);
    const actions: Action[] = [];
    const navigations: string[] = [];
    const closed$ = new Subject<void>();
    const listeners = new Set<() => void>();

    const clientDependencies: IStoreDependencies = {
        ...dependencies,
        pkcs11,
        navigation: { navigate: ({ to }) => { navigations.push(to); } }
    };
    const record: Middleware = api => next => (action: AnyAction) => {
        actions.push(action);
        const result = next(action);
        // Answered once the epic that opened the dialog listens for its result
        if (modalShow.match(action)) {
            const answered = answer(action.payload);
            if (answered) {
                queueMicrotask(() => api.dispatch(modalClose({ id: action.payload.id, reason: 'RESULT', data: answered.data }) as AnyAction));
            }
        }
        return result;
    };
    const epicMiddleware = createEpicMiddleware<Action, Action, IRootState, IStoreDependencies>({ dependencies: clientDependencies });
    const reducer = combineReducers(rootReducer);
    const store = createStore(
        reducer,
        mergePersistedState(reducer(undefined, { type: '@@weaver/INIT' }), restorePersistedState(persisted)) as IRootState,
        applyMiddleware(record, epicMiddleware)
    );

    store.subscribe(() => listeners.forEach(listener => listener()));

    epicMiddleware.run((action$, state$, deps) => rootEpic(action$, state$, deps).pipe(takeUntil(closed$)));
    store.dispatch(initialize.started(undefined));

    const waitUntil = <T>(check: () => T | undefined, what: string, timeout: number) => new Promise<T>((resolve, reject) => {
        const done = () => {
            const value = check();
            if (undefined !== value) {
                cleanup();
                resolve(value);
            }
        };
        const timer = setInterval(done, 100);
        const deadline = setTimeout(() => {
            cleanup();
            reject(new Error(`timed out after ${timeout} ms waiting for ${what}; last actions: ${describeActions(actions.slice(-15))}`));
        }, timeout);
        const cleanup = () => {
            clearInterval(timer);
            clearTimeout(deadline);
            listeners.delete(done);
        };
        listeners.add(done);
        done();
    });

    return {
        settings,
        store,
        actions,
        navigations,
        screen: () => selectScreen(store.getState()),
        persisted: () => JSON.parse(JSON.stringify(selectPersistedState(store.getState()))),
        dispatch: action => { store.dispatch(action); },
        waitFor: (condition, what, timeout = 60000) =>
            waitUntil(() => condition(store.getState()) ? store.getState() : undefined, what, timeout),
        waitForAction: (match, what, from = 0, timeout = 60000) =>
            waitUntil(() => actions.slice(from).find(match), what, timeout),
        close: () => {
            closed$.next();
            closed$.complete();
        }
    };
};
