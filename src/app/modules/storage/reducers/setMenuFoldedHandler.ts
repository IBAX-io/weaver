/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { setMenuFolded } from '../actions';
import { Reducer } from 'modules';

const setMenuFoldedHandler: Reducer<typeof setMenuFolded, State> = (state, payload) => ({
    ...state,
    menuFolded: payload
});

export default setMenuFoldedHandler;