/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { acquireSession, cryptoChanged, logout } from '../actions';
import { ISection } from 'ibax/content';
import { sectionsInit } from 'modules/sections/actions';
import { fetchNotifications, ecosystemInit } from 'modules/content/actions';
import { modalShow } from 'modules/modal/actions';
import { displayableAuthError } from '../util/authErrors';
import { defer, forkJoin, from, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { cryptoSuiteKey } from 'lib/crypto/suites';

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

        // A session restored at start was signed in under the key algorithms the network had then.
        // The node reports the ones it has now: changed (the chain's crypto settings were changed),
        // the account's address and every signature would be the old ones, so the session ends and
        // the user signs in again under the new ones.
        return defer(() => client.getUid()).pipe(
            mergeMap(uid => cryptoSuiteKey(uid.cryptoSuite) === cryptoSuiteKey(action.payload.cryptoSuite)
                ? forkJoin([
                    from(client.sections({ locale: state.storage.locale })).pipe(map(s => s.list)),
                    from(client.getParam({ name: 'stylesheet' })).pipe(map(p => p.value), catchError(e => of(''))),
                    from(client.getParam({ name: 'print_stylesheet' })).pipe(map(p => p.value), catchError(e => of('')))
                ])
                : throwError(() => ({ error: 'E_CRYPTO_CHANGED' }))
            ),
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
                if (e && 'E_CRYPTO_CHANGED' === e.error) {
                    // Signed out, back to the accounts of this network under its algorithms; the
                    // sign-in page says why (a modal would be closed by the sign-out)
                    return of(
                        acquireSession.failed({ params: action.payload, error: 'E_CRYPTO_CHANGED' }),
                        cryptoChanged(),
                        logout.started(null)
                    );
                }
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