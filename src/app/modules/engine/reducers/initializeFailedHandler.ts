/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { initialize } from '../actions';
import { Reducer } from 'modules';

const initializeFailedHandler: Reducer<typeof initialize.failed, State> = (state, payload) => ({
    ...state,
    isLoaded: true,
    fatalError: payload.error
});

export default initializeFailedHandler;