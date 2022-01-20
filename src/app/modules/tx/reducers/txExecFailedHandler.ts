/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { txExec } from '../actions';
import { Reducer } from 'modules';

const txExecFailedHandler: Reducer<typeof txExec.failed, State> = (state, payload) => ({
    ...state,
    transactions: state.transactions.set(payload.params.uuid, {
        status: 'error',
        error: payload.error,
        stack: []
    })
});

export default txExecFailedHandler;