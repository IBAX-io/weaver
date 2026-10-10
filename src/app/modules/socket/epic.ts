/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import connectEpic from './epics/connectEpic';
import disconnectEpic from './epics/disconnectEpic';
import sessionConnectEpic from './epics/sessionConnectEpic';
import logoutDisconnectEpic from './epics/logoutDisconnectEpic';
import accountNotificationsEpic from './epics/accountNotificationsEpic';
import notificationsEpic from './epics/notificationsEpic';

export default combineIsolatedEpics({
    connectEpic,
    disconnectEpic,
    sessionConnectEpic,
    logoutDisconnectEpic,
    accountNotificationsEpic,
    notificationsEpic
});
