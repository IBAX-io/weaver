/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { modalShow } from '../actions';
import { Reducer } from 'modules';

// Dialogs whose answer is a password or a private key: never kept in the state, whoever opens them
const SECRET_MODAL_TYPES = ['AUTHORIZE', 'AUTH_CHANGE_PASSWORD'];

const modalShowHandler: Reducer<typeof modalShow, State> = (state, payload) => ({
    ...state,
    id: payload.id,
    type: payload.type,
    secret: !!payload.secret || SECRET_MODAL_TYPES.includes(payload.type),
    params: {
        ...payload.params
    },
    result: null
});

export default modalShowHandler;