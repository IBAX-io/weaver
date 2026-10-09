/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { acquireSession, E_CRYPTO_CHANGED } from '../actions';
import { CryptoChangedError, signOutForCryptoChange } from '../util/cryptoChange';
import { ISection } from 'ibax/content';
import { ISectionResponse } from 'ibax/api';
import { sectionsInit } from 'modules/sections/actions';
import { fetchNotifications, ecosystemInit } from 'modules/content/actions';
import { modalShow } from 'modules/modal/actions';
import { displayableAuthError } from '../util/authErrors';
import { defer, forkJoin, from, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { sameNodeCrypto } from 'lib/crypto/signer';
import { isSessionRetryError } from '../util/sessionRetry';
import { isSessionExpiredError, signOutForExpiredSession } from '../util/sessionExpiry';

enum RemoteSectionStatus {
    Removed = '0',
    Default = '1',
    Main = '2'
}

const acquireSessionEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(acquireSession.started),
    // A newer attempt (the retry, or the user asking again) replaces one still waiting for the node
    switchMap(action => {
        const state = state$.value;
        const client = api({
            apiHost: action.payload.network.apiHost,
            sessionToken: action.payload.sessionToken
        });

        // The session was signed in under the key algorithms (and FIPS mode) the network had then (a restored one
        // maybe days ago). The node reports the ones it has now, asked alongside the sections:
        // changed (the chain's crypto settings were), the account's address and every signature
        // would be the old ones, so the session ends and the user signs in again under the new ones.
        // The sections failing (as with a token the node no longer takes) waits for that answer.
        return forkJoin([
            defer(() => client.getUid()),
            from(client.sections({ locale: state.storage.locale })).pipe(
                map(s => ({ list: s.list, error: null as unknown })),
                catchError(error => of({ list: [] as ISectionResponse[], error }))
            ),
            from(client.getParam({ name: 'stylesheet' })).pipe(map(p => p.value), catchError(e => of(''))),
            from(client.getParam({ name: 'print_stylesheet' })).pipe(map(p => p.value), catchError(e => of('')))
        ]).pipe(
            mergeMap(([uid, answer, stylesheet, printStylesheet]) => {
                if (!action.payload.cryptoSuite || !sameNodeCrypto(uid, action.payload)) {
                    throw new CryptoChangedError('session');
                }
                if (answer.error) {
                    throw answer.error;
                }
                const sections = answer.list;
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
                if (e instanceof CryptoChangedError) {
                    // Signed out, back to the accounts of this network under its algorithms; the
                    // sign-in page says why (a modal would be closed by the sign-out)
                    return of(
                        acquireSession.failed({ params: action.payload, error: E_CRYPTO_CHANGED }),
                        ...signOutForCryptoChange(state$.value, action.payload, e.during)
                    );
                }
                const rawError = (e && (e.error || e.message)) || 'E_OFFLINE';
                const error = typeof rawError === 'string' ? rawError : 'E_SERVER';
                if (isSessionExpiredError(error)) {
                    // The node is the same algorithms' but no longer takes the token: signed out,
                    // the sign-in page says the session expired
                    return of(
                        acquireSession.failed({ params: action.payload, error }),
                        ...signOutForExpiredSession(state$.value, action.payload, 'session')
                    );
                }
                if (isSessionRetryError(error)) {
                    // Still signed in: the app says the node is not reachable and asks again
                    return of(acquireSession.failed({ params: action.payload, error }));
                }
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