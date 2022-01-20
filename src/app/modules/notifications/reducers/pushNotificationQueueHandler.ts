/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { spawnNotification } from '../actions';
import { Reducer } from 'modules';

const pushNotificationQueueHandler: Reducer<typeof spawnNotification, State> = (state, payload) => ({
    ...state,
    queue: [
        ...state.queue,
        payload
    ]
});

export default pushNotificationQueueHandler;