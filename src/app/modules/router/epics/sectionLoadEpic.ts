/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { locationChange } from '../actions';
import { renderPage } from 'modules/sections/actions';
import { Observable } from 'rxjs';
import { state$ } from 'store';
import { initialize } from 'modules/engine/actions';
import { isType, Action } from 'typescript-fsa';
import { RouterState, replace } from 'connected-react-router';
import { createEditorTab, loadEditorTab } from 'modules/editor/actions';

const sectionLoadEpic: Epic = (action$, store, { routerService }) => action$
    .filter(action => isType(action, initialize.started) || isType(action, locationChange))
    .map((action: Action<any>) => {
        if (isType(action, initialize.started)) {
            return store.getState().router;
        }

        return action.payload;
    })
    .delayWhen(() => state$.filter(l => l.auth.isAcquired).take(1))
    .flatMap((routerState: RouterState) => {
        const match = routerService.matchRoute('/browse(/:section)(/:page)', routerState.location.pathname + routerState.location.search);
        const state = store.getState();

        if (state.auth.isAuthenticated && match) {
            const section = state.sections.sections[match.parts.section || state.sections.mainSection];

            if (!section) {
                return Observable.of(replace(
                    routerService.routeToBrowser(state.sections.mainSection, state.sections.sections[state.sections.mainSection].defaultPage)
                ));
            }

            const pageName = match.parts.page || section.defaultPage;

            // TODO: OLD EDITOR API COMPAT
            if ('editor' === pageName) {
                if (match.query.create) {
                    return Observable.of(
                        createEditorTab.started(match.query.create),
                        replace('/editor')
                    );
                }
                else if (match.query.open) {
                    return Observable.of(
                        loadEditorTab.started({ type: match.query.open, name: match.query.name }),
                        replace('/editor')
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

            return Observable.of(renderPage.started({
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
            return Observable.empty();
        }

    }).catch(e => {
        // tslint:disable-next-line: no-console
        console.log(e);
        return Observable.of(e);
    });

export default sectionLoadEpic;