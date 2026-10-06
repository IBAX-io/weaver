/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import sendAttachmentEpic from './epics/sendAttachmentEpic';

export default combineIsolatedEpics({
    sendAttachmentEpic
});