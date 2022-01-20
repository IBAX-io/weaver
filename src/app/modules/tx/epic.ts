/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import txCallEpic from './epics/txCallEpic';
import txAuthorizeEpic from './epics/txAuthorizeEpic';
import txExecEpic from './epics/txExecEpic';
import txExecFailedEpic from './epics/txExecFailedEpic';
import reloadStylesheetEpic from './epics/reloadStylesheetEpic';

export default combineEpics(
    txCallEpic,
    txAuthorizeEpic,
    txExecEpic,
    txExecFailedEpic,
    reloadStylesheetEpic
);