/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import closeModalOnInteractionEpic from './epics/closeModalOnInteractionEpic';
import removeNetworkEpic from './epics/removeNetworkEpic';

export default combineEpics(
    closeModalOnInteractionEpic,
    removeNetworkEpic
);