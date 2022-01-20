/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { initialize } from '../actions';
import { Reducer } from 'modules';

const initializeDoneHandler: Reducer<typeof initialize.done, State> = (state, payload) => ({
    ...state,
    isLoaded: true,
    preconfiguredNetworks: payload.result.preconfiguredNetworks,
    locales: payload.result.locales
});

export default initializeDoneHandler;