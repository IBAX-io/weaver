/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { destroyNotification, spawnNotification } from '../actions';

const destroyNotificationEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(destroyNotification),
    mergeMap(action => {
        const state = state$.value;
        if (state.notifications.queue.length) {
            const queuedNotification = state.notifications.queue[0];
            return of(spawnNotification(queuedNotification));
        }
        else {
            return EMPTY;
        }
    })
);

export default destroyNotificationEpic;
