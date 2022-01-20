/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { addNetwork } from '../actions';
import { Reducer } from 'modules';

const addNetworkDoneHandler: Reducer<typeof addNetwork.done, State> = (state) => ({
    ...state,
    isConnecting: false
});

export default addNetworkDoneHandler;