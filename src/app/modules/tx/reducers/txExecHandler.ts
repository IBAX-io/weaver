/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { txExec } from '../actions';
import { Reducer } from 'modules';

const txExecHandler: Reducer<typeof txExec.started, State> = (state, payload) => ({
    ...state,
    transactions: state.transactions.set(payload.uuid, {
        status: 'pending',
        error: null,
        stack: []
    })
});

export default txExecHandler;