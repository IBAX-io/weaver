/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { subscribe } from '../actions';
import { Reducer } from 'modules';
import { IAccount } from 'ibax/api';
import { INotificationsMessage } from 'ibax/socket';

const flattenNotifications = (id: string, info: IAccount) => {
    const stack: INotificationsMessage[] = [];
    info.access.forEach(ecosystem => {
        ecosystem.notifications.forEach(notification => {
            stack.push({
                id,
                ecosystem: ecosystem.ecosystem,
                role: notification.role_id,
                count: Number(notification.count)
            });
        });
    });

    return stack;
};

const subscribeHandler: Reducer<typeof subscribe.started, State> = (state, payload) => ({
    ...state,
    notifications: [
        ...state.notifications.filter(l => l.id !== payload.id),
        ...flattenNotifications(payload.id, payload)
    ]
});

export default subscribeHandler;