/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { delay, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { spawnNotification, destroyNotification } from '../actions';

const spawnNotificationEpic: Epic = action$ => action$.pipe(
    ofAction(spawnNotification),
    delay(5000),
    map(action =>
        destroyNotification(action.payload.id)
    )
);

export default spawnNotificationEpic;
