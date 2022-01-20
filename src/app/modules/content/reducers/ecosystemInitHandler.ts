/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { ecosystemInit } from '../actions';
import { Reducer } from 'modules';

const ecosystemInitDoneHandler: Reducer<typeof ecosystemInit, State> = (state, payload) => ({
    ...state,
    stylesheet: payload.stylesheet,
    printStylesheet: ''
});

export default ecosystemInitDoneHandler;