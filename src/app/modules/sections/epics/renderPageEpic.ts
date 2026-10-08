/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { concat, defer, EMPTY, from, iif, Observable, of } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { renderPage } from '../actions';
import { STATIC_PAGES } from 'lib/staticPages';
import { modalShow } from 'modules/modal/actions';
import { signedInSession } from 'modules/auth/selectors';
import { E_SIGNED_OUT } from 'modules/auth/actions';

const renderPageEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(renderPage.started),
    switchMap(action => {
        const state = state$.value;
        const session = signedInSession(state);
        // Signed out of since it was asked for: the node is not asked
        if (!session) {
            return of(renderPage.failed({ params: action.payload, error: E_SIGNED_OUT }));
        }
        const client = api({
            apiHost: session.network.apiHost,
            sessionToken: session.sessionToken
        });

        const staticPage = STATIC_PAGES[action.payload.name];
        const substitute = staticPage && staticPage.renderSubstitute && staticPage.renderSubstitute(action.payload.params);
        const requestPage = staticPage ? substitute : {
            name: action.payload.name,
            params: action.payload.params
        };

        return from(client.content({
            type: 'page',
            locale: state.storage.locale,
            ...requestPage

        })).pipe(
            mergeMap((content): Observable<Action> => concat(
                of(renderPage.done({
                    params: action.payload,
                    result: {
                        tree: content.tree,
                        menu: content.menu,
                        menuTree: content ? content.menutree : [],
                        static: !!staticPage
                    }
                })),
                iif(
                    () => !!action.payload.popup,
                    defer(() => of(modalShow({
                        id: 'PAGE_MODAL' + action.payload.name,
                        type: 'PAGE_MODAL',
                        params: {
                            name: action.payload.name,
                            section: action.payload.section,
                            title: action.payload.popup.title || action.payload.name,
                            width: action.payload.popup.width,
                            tree: content.tree,
                            params: action.payload.params,
                            static: !!staticPage
                        }
                    }))),
                    EMPTY
                )
            )),
            catchError(e => of(renderPage.failed({
                params: action.payload,
                error: (e && (e.error || e.message)) || 'E_SERVER'
            })))
        );
    })
);

export default renderPageEpic;
