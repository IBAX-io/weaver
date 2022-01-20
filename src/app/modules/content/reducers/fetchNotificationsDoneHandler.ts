/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { fetchNotifications } from '../actions';
import { Reducer } from 'modules';

const fetchNotificationsDoneHandler: Reducer<typeof fetchNotifications.done, State> = (state, payload) => ({
    ...state,
    notifications: payload.result
});

export default fetchNotificationsDoneHandler;