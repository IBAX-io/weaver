/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State, initialState } from '../reducer';
import { Reducer } from 'modules';
import { localstorageInit } from '../actions';

const rehydrateHandler: Reducer<typeof localstorageInit, State> = state => ({
    ...initialState,
    ...state
});

export default rehydrateHandler;