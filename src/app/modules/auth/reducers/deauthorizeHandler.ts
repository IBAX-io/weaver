/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { deauthorize } from '../actions';
import { Reducer } from 'modules';

const deauthorizeHandler: Reducer<typeof deauthorize, State> = (state, payload) => ({
    ...state,
    privateKey: null
});

export default deauthorizeHandler;