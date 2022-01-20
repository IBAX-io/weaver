/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { authorize } from '../actions';
import { Reducer } from 'modules';

const authorizeHandler: Reducer<typeof authorize, State> = (state, payload) => ({
    ...state,
    privateKey: payload
});

export default authorizeHandler;