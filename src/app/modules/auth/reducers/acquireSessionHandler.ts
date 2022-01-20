/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { acquireSession } from '../actions';
import { Reducer } from 'modules';

const acquireSessionHandler: Reducer<typeof acquireSession.started, State> = (state): State => ({
    ...state,
    isAcquired: false
});

export default acquireSessionHandler;