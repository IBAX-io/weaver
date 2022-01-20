/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { txExec } from '../actions';
import { Reducer } from 'modules';

const txExecDoneHandler: Reducer<typeof txExec.done, State> = (state, payload) => ({
    ...state,
    transactions: state.transactions.set(payload.params.uuid, {
        status: 'done',
        error: null,
        stack: payload.result
    })
});

export default txExecDoneHandler;