/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import saveWalletOnImportEpic from './epics/saveWalletOnImportEpic';
import saveWalletOnCreateEpic from './epics/saveWalletOnCreateEpic';

export default combineEpics(
    saveWalletOnCreateEpic,
    saveWalletOnImportEpic
);