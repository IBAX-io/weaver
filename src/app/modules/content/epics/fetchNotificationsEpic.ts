/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { fetchNotifications } from 'modules/content/actions';
import { signedInSession } from 'modules/auth/selectors';

const fetchNotificationsEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(fetchNotifications.started),
    mergeMap(action => {
        const state = state$.value;
        const session = signedInSession(state);
        // Signed out of since it was asked for: the node is not asked
        if (!session) {
            return of(fetchNotifications.failed({ params: action.payload, error: undefined }));
        }
        const client = api({
            apiHost: session.network.apiHost,
            sessionToken: session.sessionToken
        });

        return from(client.content({
            type: 'page',
            name: '@1notifications',
            params: {},
            locale: state.storage.locale

        })).pipe(
            map(payload =>
                fetchNotifications.done({
                    params: action.payload,
                    result: payload.tree
                })
            ),
            catchError(e =>
                of(fetchNotifications.failed({
                    params: action.payload,
                    error: null
                }))
            )
        );
    })
);

export default fetchNotificationsEpic;
