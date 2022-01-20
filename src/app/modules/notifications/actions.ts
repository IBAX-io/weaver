/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { INotification } from 'ibax/notifications';
import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory('notifications');
export const enqueueNotification = actionCreator<INotification>('ENQUEUE_NOTIFICATION');
export const spawnNotification = actionCreator<INotification>('SPAWN_NOTIFICATION');
export const destroyNotification = actionCreator<string>('DESTROY_NOTIFICATION');
export const pushNotificationQueue = actionCreator<INotification>('PUSH_NOTIFICATION_QUEUE');