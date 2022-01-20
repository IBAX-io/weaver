/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import spawnNotificationEpic from './epics/spawnNotificationEpic';
import enqueueNotificationEpic from './epics/enqueueNotificationEpic';
import destroyNotificationEpic from './epics/destroyNotificationEpic';

export default combineEpics(
    destroyNotificationEpic,
    enqueueNotificationEpic,
    spawnNotificationEpic
);