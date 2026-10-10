/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { clearNotifications } from '../actions';
import { Reducer } from 'modules';

const clearNotificationsHandler: Reducer<typeof clearNotifications, State> = (state, payload) => ({
    ...state,
    notifications: state.notifications.filter(l => l.id !== payload.id)
});

export default clearNotificationsHandler;
