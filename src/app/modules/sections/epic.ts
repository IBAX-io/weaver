/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import renderPageEpic from './epics/renderPageEpic';
import reloadPageEpic from './epics/reloadPageEpic';

export default combineIsolatedEpics({
    renderPageEpic,
    reloadPageEpic
});