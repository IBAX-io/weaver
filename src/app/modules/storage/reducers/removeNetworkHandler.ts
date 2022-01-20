/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { removeNetwork } from '../actions';
import { Reducer } from 'modules';

const removeNetworkHandler: Reducer<typeof removeNetwork, State> = (state, payload) => ({
    ...state,
    networks: state.networks.filter(l => l.uuid !== payload),
});

export default removeNetworkHandler;