/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { setMenuActive } from '../actions';
import { Reducer } from 'modules';

const setMenuActiveHandler: Reducer<typeof setMenuActive, State> = (state, payload) => ({
    ...state,
    menuActive: payload
});

export default setMenuActiveHandler;