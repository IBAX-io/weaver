/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { initialize, discoverNetwork } from '../actions';

// At start the network is asked again what it is now: the persisted guest session holds the key
// algorithms of the last start, and the sign-in page would list accounts and addresses under
// those. A signed-in user's session is checked by acquireSessionEpic instead, and keeps its
// network meanwhile.
const connectDefaultEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(initialize.done),
    mergeMap(action => {
        const state = state$.value;
        if (state.auth.isAuthenticated && state.engine.guestSession) {
            return EMPTY;
        }
        const stored = (uuid: string) => !!uuid && state.storage.networks.some(network => network.uuid === uuid);
        const last = state.engine.guestSession?.network.uuid;
        const uuid = stored(last) ? last : action.payload.result.defaultNetwork;
        return stored(uuid) ? of(discoverNetwork.started({ uuid })) : EMPTY;
    })
);
export default connectDefaultEpic;
