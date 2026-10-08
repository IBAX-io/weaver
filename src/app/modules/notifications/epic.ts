/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import spawnNotificationEpic from './epics/spawnNotificationEpic';
import enqueueNotificationEpic from './epics/enqueueNotificationEpic';
import destroyNotificationEpic from './epics/destroyNotificationEpic';

export default combineIsolatedEpics({
    destroyNotificationEpic,
    enqueueNotificationEpic,
    spawnNotificationEpic
});