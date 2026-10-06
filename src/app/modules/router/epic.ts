/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import sectionLoadEpic from './epics/sectionLoadEpic';

export default combineIsolatedEpics({
    sectionLoadEpic
});