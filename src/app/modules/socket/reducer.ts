/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Centrifuge } from 'centrifuge';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import * as actions from './actions';
import { INotificationsMessage } from 'ibax/socket';
import connectDoneHandler from './reducers/connectDoneHandler';
import disconnectDoneHandler from './reducers/disconnectDoneHandler';
import setNotificationsCountHandler from './reducers/setNotificationsCountHandler';
import setConnectedHandler from './reducers/setConnectedHandler';
import loadNotificationsHandler from './reducers/loadNotificationsHandler';
import clearNotificationsHandler from './reducers/clearNotificationsHandler';

export type State = {
    readonly session: string;
    readonly socket: Centrifuge;
    readonly connected: boolean;
    readonly notifications: INotificationsMessage[];
};

export const initialState: State = {
    session: null,
    socket: null,
    connected: false,
    notifications: []
};

export default reducerWithInitialState<State>(initialState)
    .case(actions.connect.done, connectDoneHandler)
    .case(actions.disconnect.done, disconnectDoneHandler)
    .case(actions.setNotificationsCount, setNotificationsCountHandler)
    .case(actions.setConnected, setConnectedHandler)
    .case(actions.loadNotifications, loadNotificationsHandler)
    .case(actions.clearNotifications, clearNotificationsHandler);
