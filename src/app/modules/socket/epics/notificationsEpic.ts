/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { fetchNotifications } from 'modules/content/actions';
import desktop from 'lib/desktop';
import { notificationsReceived, setNotificationsCount } from '../actions';
import setNotificationsCountHandler from '../reducers/setNotificationsCountHandler';
import findNotificationsCount from '../util/findNotificationsCount';

// The counts published to the signed-in account's channel: those of every role of the account in
// an ecosystem. A change of the count the session shows fetches its notifications again.
const notificationsEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(notificationsReceived),
    mergeMap(action => {
        const state = state$.value;
        const context = state.auth.wallet;
        if (!state.auth.isAuthenticated || !context || !Array.isArray(action.payload)) {
            return EMPTY;
        }

        const counts = action.payload.map(n => setNotificationsCount({
            id: context.wallet.id,
            ecosystem: String(n.ecosystem),
            role: String(n.role_id),
            count: Number(n.count)
        }));
        const before = findNotificationsCount(state.socket, context);
        const after = findNotificationsCount(counts.reduce((socket, count) => setNotificationsCountHandler(socket, count.payload), state.socket), context);

        if (desktop) {
            desktop.setBadgeCount(after);
        }
        return before === after ? of(...counts) : of(...counts, fetchNotifications.started(undefined));
    })
);

export default notificationsEpic;
