/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { destroyNotification, spawnNotification } from '../actions';
import { Observable } from 'rxjs/Observable';

const destroyNotificationEpic: Epic = (action$, store) => action$.ofAction(destroyNotification)
    .flatMap(action => {
        const state = store.getState();
        if (state.notifications.queue.length) {
            const queuedNotification = state.notifications.queue[0];
            return Observable.of(spawnNotification(queuedNotification));
        }
        else {
            return Observable.empty();
        }
    });

export default destroyNotificationEpic;