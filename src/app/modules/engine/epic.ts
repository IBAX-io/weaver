/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import initializeEpic from './epics/initializeEpic';
import setLocaleEpic from './epics/setLocaleEpic';
import discoverNetworkEpic from './epics/discoverNetworkEpic';
import addNetworkEpic from './epics/addNetworkEpic';
import discoverNetworkFailedEpic from './epics/discoverNetworkFailedEpic';
import connectDefaultEpic from './epics/connectDefaultEpic';

export default combineIsolatedEpics({
    initializeEpic,
    setLocaleEpic,
    discoverNetworkEpic,
    discoverNetworkFailedEpic,
    addNetworkEpic,
    connectDefaultEpic
});