/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action as ReduxAction } from 'redux';
import { defer, EMPTY, Observable, of } from 'rxjs';
import { catchError, delayWhen, filter, map, mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { locationChange } from '../actions';
import { renderPage } from 'modules/sections/actions';
import { initialize } from 'modules/engine/actions';
import { isType } from 'typescript-fsa';
import { navigate } from '../actions';
import { IRouterState } from '../types';
import { createEditorTab, loadEditorTab } from 'modules/editor/actions';

const sectionLoadEpic: Epic = (action$, state$, { routerService }) => action$.pipe(
    ofAction(initialize.started, locationChange),
    map((action): IRouterState => {
        // Only initialize.started and locationChange reach here (see ofAction above)
        if (isType(action, locationChange)) {
            return action.payload;
        }

        return state$.value.router;
    }),
    delayWhen(() => state$.pipe(filter(l => l.auth.isAcquired), take(1))),
    mergeMap((routerState: IRouterState): Observable<ReduxAction> => defer((): Observable<ReduxAction> => {
        const match = routerService.matchRoute('/browse(/:section)(/:page)', routerState.location.pathname + routerState.location.search);
        const state = state$.value;

        if (state.auth.isAuthenticated && match) {
            const section = state.sections.sections[match.parts.section || state.sections.mainSection];

            if (!section) {
                return of(navigate({
                    to: routerService.routeToBrowser(state.sections.mainSection, state.sections.sections[state.sections.mainSection].defaultPage),
                    replace: true
                }));
            }

            const pageName = match.parts.page || section.defaultPage;

            // TODO: OLD EDITOR API COMPAT
            if ('editor' === pageName) {
                if (match.query.create) {
                    return of(
                        createEditorTab.started(match.query.create),
                        navigate({ to: '/editor', replace: true })
                    );
                }
                else if (match.query.open) {
                    return of(
                        loadEditorTab.started({ type: match.query.open, name: match.query.name }),
                        navigate({ to: '/editor', replace: true })
                    );
                }
            }

            // TODO: refactoring
            // must ignore navigation when page and params are equal
            // if ('POP' === action.payload.action) {
            //     const pageIndex = findPage(section, pageName);
            //     if (-1 !== pageIndex) {
            //         const page = store.value.navigator.sections[section.name].pages[pageIndex];
            //         if (page.content || page.error) {
            //             return of(popPage({
            //                 location: action.payload.location,
            //                 section: section.name,
            //                 name: pageName
            //             }));
            //         }
            //     }
            // }

            return of(renderPage.started({
                location: {
                    state: {},
                    ...routerState.location
                },
                section: section.name,
                name: pageName,
                params: match.query
            }));
        }
        else {
            return EMPTY;
        }

    }).pipe(
        // Handled per navigation: a failure must neither emit a non-action nor end the epic
        catchError(e => {
            console.error('Section load failed', e);
            return EMPTY;
        })
    ))
);

export default sectionLoadEpic;
