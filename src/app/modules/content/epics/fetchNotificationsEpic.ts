/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs/Observable';
import { fetchNotifications } from 'modules/content/actions';

const fetchNotificationsEpic: Epic = (action$, store, { api }) => action$.ofAction(fetchNotifications.started)
    .flatMap(action => {
        const state = store.getState();
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });

        return Observable.fromPromise(client.content({
            type: 'page',
            name: '@1notifications',
            params: {},
            locale: state.storage.locale

        })).map(payload =>
            fetchNotifications.done({
                params: action.payload,
                result: payload.tree
            })
        ).catch(e =>
            Observable.of(fetchNotifications.failed({
                params: action.payload,
                error: null
            }))
        );
    });

export default fetchNotificationsEpic;