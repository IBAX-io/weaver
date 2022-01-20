/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from './actions';
import { IModal } from 'ibax/modal';
import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import modalShowHandler from './reducers/modalShowHandler';
import modalCloseHandler from './reducers/modalCloseHandler';

export type State =
    IModal;

export const initialState: State = {
    id: null,
    type: null,
    result: null,
    params: null
};

export default reducerWithInitialState<State>(initialState)
    .case(actions.modalShow, modalShowHandler)
    .case(actions.modalClose, modalCloseHandler);