/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import renderPageEpic from './epics/renderPageEpic';
import reloadPageEpic from './epics/reloadPageEpic';

export default combineEpics(
    renderPageEpic,
    reloadPageEpic
);