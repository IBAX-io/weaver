/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { setConnected } from '../actions';
import { Reducer } from 'modules';

const setConnectedHandler: Reducer<typeof setConnected, State> = (state, payload) => ({
    ...state,
    connected: payload
});

export default setConnectedHandler;