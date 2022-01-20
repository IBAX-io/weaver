/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { destroyNotification } from '../actions';
import { Reducer } from 'modules';

const destroyNotificationHandler: Reducer<typeof destroyNotification, State> = (state, payload) => ({
    ...state,
    notifications: state.notifications.filter(l => l.id !== payload)
});

export default destroyNotificationHandler;