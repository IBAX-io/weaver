/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { modalClose } from '../actions';
import { Reducer } from 'modules';

// Only the modal on screen can be closed; a secret result is not kept in state
const modalCloseHandler: Reducer<typeof modalClose, State> = (state, payload) => payload.id !== state.id ? state : {
    ...state,
    result: {
        reason: payload.reason,
        data: state.secret ? null : payload.data
    }
};

export default modalCloseHandler;