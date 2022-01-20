/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { connect } from '../actions';
import { Reducer } from 'modules';

const connectDoneHandler: Reducer<typeof connect.done, State> = (state, payload) => ({
    ...state,
    session: payload.result.session,
    socket: payload.result.instance,
    notifications: [],
    connected: true
});

export default connectDoneHandler;