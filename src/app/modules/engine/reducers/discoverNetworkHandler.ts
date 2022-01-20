/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { discoverNetwork } from '../actions';
import { Reducer } from 'modules';

const discoverNetworkHandler: Reducer<typeof discoverNetwork.started, State> = (state, payload) => ({
    ...state,
    isConnecting: true
});

export default discoverNetworkHandler;