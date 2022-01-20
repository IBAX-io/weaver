/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import displayDataEpic from './epics/displayDataEpic';
import fetchNotificationsEpic from './epics/fetchNotificationsEpic';
import buttonInteractionEpic from './epics/buttonInteractionEpic';

export default combineEpics(
    displayDataEpic,
    fetchNotificationsEpic,
    buttonInteractionEpic
);