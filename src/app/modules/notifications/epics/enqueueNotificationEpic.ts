/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { enqueueNotification, spawnNotification, pushNotificationQueue } from '../actions';

const enqueueNotificationEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(enqueueNotification),
    map(action => {
        const state = state$.value;
        if (state.notifications.NOTIFICATIONS_PER_SCREEN <= state.notifications.notifications.length) {
            return pushNotificationQueue(action.payload);
        }
        else {
            return spawnNotification(action.payload);
        }
    })
);

export default enqueueNotificationEpic;
