/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { acquireSession } from '../actions';
import { ISection } from 'ibax/content';
import { sectionsInit } from 'modules/sections/actions';
import { fetchNotifications, ecosystemInit } from 'modules/content/actions';
import { modalShow } from 'modules/modal/actions';
import { displayableAuthError } from '../util/authErrors';
import { forkJoin, from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';

enum RemoteSectionStatus {
    Removed = '0',
    Default = '1',
    Main = '2'
}

const acquireSessionEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(acquireSession.started),
    mergeMap(action => {
        const state = state$.value;
        const client = api({
            apiHost: action.payload.network.apiHost,
            sessionToken: action.payload.sessionToken
        });

        return forkJoin([
            from(client.sections({ locale: state.storage.locale })).pipe(map(s => s.list)),
            from(client.getParam({ name: 'stylesheet' })).pipe(map(p => p.value), catchError(e => of(''))),
            from(client.getParam({ name: 'print_stylesheet' })).pipe(map(p => p.value), catchError(e => of('')))

        ]).pipe(
            mergeMap(([sections, stylesheet, printStylesheet]) => {
                const sectionsResult: { [name: string]: ISection } = {};
                const mainSection = sections.find(l => RemoteSectionStatus.Main === l.status);

                sections.forEach((section, index) => {
                    sectionsResult[section.urlname] = {
                        index,
                        name: section.urlname,
                        title: section.title,
                        defaultPage: section.page,
                        breadcrumbs: [{
                            caller: '',
                            type: 'PAGE',
                            title: section.title,
                            section: section.urlname,
                            page: section.page,
                            params: {}
                        }],
                        menus: [],
                        page: undefined
                    };
                });

                return of(
                    sectionsInit({
                        mainSection: mainSection ? mainSection.urlname : sections[0].urlname,
                        sections: sectionsResult
                    }),
                    ecosystemInit({
                        stylesheet,
                        printStylesheet
                    }),
                    fetchNotifications.started(undefined),
                    acquireSession.done({
                        params: action.payload,
                        result: true
                    })
                );
            }),
            catchError(e => {
                const rawError = (e && (e.error || e.message)) || 'E_OFFLINE';
                const error = typeof rawError === 'string' ? rawError : 'E_SERVER';
                return of(
                    acquireSession.failed({
                        params: action.payload,
                        error
                    }),
                    modalShow({
                        id: 'AUTH_ERROR',
                        type: 'AUTH_ERROR',
                        params: {
                            // Only codes with an auth.error.* translation reach the UI; raw exception text never does
                            error: displayableAuthError(error)
                        }
                    })
                );
            })
        );
    })
);

export default acquireSessionEpic;