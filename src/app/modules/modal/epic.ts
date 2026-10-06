/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineIsolatedEpics } from 'lib/rx/combineIsolatedEpics';
import closeModalOnInteractionEpic from './epics/closeModalOnInteractionEpic';
import removeNetworkEpic from './epics/removeNetworkEpic';

export default combineIsolatedEpics({
    closeModalOnInteractionEpic,
    removeNetworkEpic
});