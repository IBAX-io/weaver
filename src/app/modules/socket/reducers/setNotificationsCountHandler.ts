/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { setNotificationsCount } from '../actions';
import { Reducer } from 'modules';

const setNotificationsCountHandler: Reducer<typeof setNotificationsCount, State> = (state, payload) => ({
    ...state,
    notifications: [
        ...state.notifications.filter(l =>
            l.id !== payload.id ||
            l.role !== payload.role ||
            l.ecosystem !== payload.ecosystem
        ),
        payload
    ]
});

export default setNotificationsCountHandler;