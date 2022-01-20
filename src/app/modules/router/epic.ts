/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import sectionLoadEpic from './epics/sectionLoadEpic';

export default combineEpics(
    sectionLoadEpic
);