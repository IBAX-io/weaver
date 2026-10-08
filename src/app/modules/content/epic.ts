/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import displayDataEpic from './epics/displayDataEpic';
import fetchNotificationsEpic from './epics/fetchNotificationsEpic';
import buttonInteractionEpic from './epics/buttonInteractionEpic';

export default combineIsolatedEpics({
    displayDataEpic,
    fetchNotificationsEpic,
    buttonInteractionEpic
});