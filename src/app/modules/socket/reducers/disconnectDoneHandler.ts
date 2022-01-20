/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { disconnect } from '../actions';
import { Reducer } from 'modules';

const disconnectDone: Reducer<typeof disconnect.done, State> = (state, payload) => ({
    ...state,
    socket: null,
    session: null,
    subscriptions: [],
    connected: false
});

export default disconnectDone;