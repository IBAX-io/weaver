/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import saveWalletOnImportEpic from './epics/saveWalletOnImportEpic';
import saveWalletOnCreateEpic from './epics/saveWalletOnCreateEpic';

export default combineIsolatedEpics({
    saveWalletOnCreateEpic,
    saveWalletOnImportEpic
});