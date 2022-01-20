/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { spawnNotification, destroyNotification } from '../actions';

const spawnNotificationEpic: Epic = (action$, store) => action$.ofAction(spawnNotification)
    .delay(5000)
    .map(action =>
        destroyNotification(action.payload.id)
    );

export default spawnNotificationEpic;