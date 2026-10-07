/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import fetchBalanceEpic from './epics/fetchBalanceEpic';
import sendTransferEpic from './epics/sendTransferEpic';
import { fetchHistoryEpic, reloadHistoryEpic } from './epics/fetchHistoryEpic';
import { fetchUtxoHistoryEpic, reloadUtxoHistoryEpic } from './epics/fetchUtxoHistoryEpic';

export default combineIsolatedEpics({
    fetchBalanceEpic,
    sendTransferEpic,
    fetchHistoryEpic,
    reloadHistoryEpic,
    fetchUtxoHistoryEpic,
    reloadUtxoHistoryEpic
});
