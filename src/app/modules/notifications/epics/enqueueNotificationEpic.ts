/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { enqueueNotification, spawnNotification, pushNotificationQueue } from '../actions';

const enqueueNotificationEpic: Epic = (action$, store) => action$.ofAction(enqueueNotification)
    .map(action => {
        const state = store.getState();
        if (state.notifications.NOTIFICATIONS_PER_SCREEN <= state.notifications.notifications.length) {
            return pushNotificationQueue(action.payload);
        }
        else {
            return spawnNotification(action.payload);
        }
    });

export default enqueueNotificationEpic;