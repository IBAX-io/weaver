/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { initialize, discoverNetwork } from '../actions';

const connectDefaultEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(initialize.done),
    filter(action => {
        const state = state$.value;
        return !!(!state.engine.guestSession && action.payload.result.defaultNetwork && state.storage.networks.find(l => l.uuid === action.payload.result.defaultNetwork));
    }),
    map(action => (
        discoverNetwork.started({ uuid: action.payload.result.defaultNetwork }))
    )
);
export default connectDefaultEpic;
