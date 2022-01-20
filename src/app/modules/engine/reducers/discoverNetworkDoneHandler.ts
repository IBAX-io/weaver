/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { discoverNetwork } from '../actions';
import { Reducer } from 'modules';

const discoverNetworkDoneHandler: Reducer<typeof discoverNetwork.done, State> = (state, payload) => ({
    ...state,
    networkError: null,
    guestSession: payload.result.session,
    isConnecting: false
});

export default discoverNetworkDoneHandler;