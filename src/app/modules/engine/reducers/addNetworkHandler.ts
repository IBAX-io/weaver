/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { addNetwork } from '../actions';
import { Reducer } from 'modules';

const addNetworkHandler: Reducer<typeof addNetwork.started, State> = (state) => ({
    ...state,
    isConnecting: true
});

export default addNetworkHandler;