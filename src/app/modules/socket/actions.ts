/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { IAccount } from 'ibax/api';
import { INotificationsCount, INotificationsMessage, IConnectCall } from 'ibax/socket';
import { Centrifuge } from 'centrifuge';

const actionCreator = actionCreatorFactory('socket');
export const connect = actionCreator.async<IConnectCall, { session: string, instance: Centrifuge }, string>('CONNECT');
export const disconnect = actionCreator.async('DISCONNECT');
// The counts an account's info lists, shown until Centrifugo sends newer ones
export const loadNotifications = actionCreator<IAccount>('LOAD_NOTIFICATIONS');
// The account is no longer in the keyring
export const clearNotifications = actionCreator<IAccount>('CLEAR_NOTIFICATIONS');
// Published to the channel of the signed-in account
export const notificationsReceived = actionCreator<INotificationsCount[]>('NOTIFICATIONS_RECEIVED');
export const setNotificationsCount = actionCreator<INotificationsMessage>('SET_NOTIFICATIONS_COUNT');
export const setConnected = actionCreator<boolean>('SET_CONNECTED');
// The client connected again by itself after a dropped connection (not the first connect)
export const reconnected = actionCreator('RECONNECTED');
