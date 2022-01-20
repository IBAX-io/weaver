/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import connectEpic from './epics/connectEpic';
import disconnectEpic from './epics/disconnectEpic';
import subscribeEpic from './epics/subscribeEpic';
import unsubscribeEpic from './epics/unsubscribeEpic';
import subscribeWalletsEpic from './epics/subscribeWalletsEpic';
import subscribeReconnectEpic from './epics/subscribeReconnectEpic';
import unsubscribeRemovedWalletEpic from './epics/unsubscribeRemovedWalletEpic';
import subscribeWalletEpic from './epics/subscribeWalletEpic';
import initConnectEpic from './epics/initConnectEpic';

export default combineEpics(
    connectEpic,
    disconnectEpic,
    subscribeEpic,
    unsubscribeEpic,
    subscribeWalletsEpic,
    subscribeWalletEpic,
    subscribeReconnectEpic,
    unsubscribeRemovedWalletEpic,
    initConnectEpic
);