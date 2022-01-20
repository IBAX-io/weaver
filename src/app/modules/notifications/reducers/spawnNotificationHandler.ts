/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { spawnNotification } from '../actions';
import { Reducer } from 'modules';

const spawnNotificationHandler: Reducer<typeof spawnNotification, State> = (state, payload) => ({
    ...state,
    queue: state.queue.filter(l => l.id !== payload.id),
    notifications: [
        payload,
        ...state.notifications
    ]
});

export default spawnNotificationHandler;