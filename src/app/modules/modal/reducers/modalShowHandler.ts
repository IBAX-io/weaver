/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { modalShow } from '../actions';
import { Reducer } from 'modules';

const modalShowHandler: Reducer<typeof modalShow, State> = (state, payload) => ({
    ...state,
    id: payload.id,
    type: payload.type,
    params: {
        ...payload.params
    },
    result: null
});

export default modalShowHandler;