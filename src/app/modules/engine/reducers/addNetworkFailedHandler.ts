/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { addNetwork } from '../actions';
import { Reducer } from 'modules';

const addNetworkFailedHandler: Reducer<typeof addNetwork.failed, State> = (state) => ({
    ...state,
    isConnecting: false
});

export default addNetworkFailedHandler;