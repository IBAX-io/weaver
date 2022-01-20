/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { modalClose } from '../actions';
import { Reducer } from 'modules';

const modalCloseHandler: Reducer<typeof modalClose, State> = (state, payload) => ({
    ...state,
    result: payload
});

export default modalCloseHandler;