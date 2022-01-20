/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { initialize, discoverNetwork } from '../actions';

const connectDefaultEpic: Epic = (action$, store) => action$.ofAction(initialize.done)
    .filter(action => {
        const state = store.getState();
        return !!(!state.engine.guestSession && action.payload.result.defaultNetwork && state.storage.networks.find(l => l.uuid === action.payload.result.defaultNetwork));
    })
    .map(action => (
        discoverNetwork.started({ uuid: action.payload.result.defaultNetwork }))
    );
export default connectDefaultEpic;