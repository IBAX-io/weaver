/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { fetchNotifications } from 'modules/content/actions';

const fetchNotificationsEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(fetchNotifications.started),
    mergeMap(action => {
        const state = state$.value;
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
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
