/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { saveNetwork } from '../actions';
import { Reducer } from 'modules';

const saveNetworkHandler: Reducer<typeof saveNetwork, State> = (state, payload) => ({
    ...state,
    networks: [
        ...state.networks.filter(l => l.uuid !== payload.uuid),
        payload
    ]
});

export default saveNetworkHandler;