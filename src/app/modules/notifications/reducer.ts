/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from './actions';
import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import { INotification } from 'ibax/notifications';
import spawnNotificationHandler from './reducers/spawnNotificationHandler';
import destroyNotificationHandler from './reducers/destroyNotificationHandler';
import pushNotificationQueueHandler from './reducers/pushNotificationQueueHandler';

export type State = {
    NOTIFICATIONS_PER_SCREEN: number;
    queue: INotification[];
    notifications: INotification[];
};

export const initialState: State = {
    NOTIFICATIONS_PER_SCREEN: 3,
    queue: [],
    notifications: []
};

export default reducerWithInitialState<State>(initialState)
    .case(actions.destroyNotification, destroyNotificationHandler)
    .case(actions.pushNotificationQueue, pushNotificationQueueHandler)
    .case(actions.spawnNotification, spawnNotificationHandler);