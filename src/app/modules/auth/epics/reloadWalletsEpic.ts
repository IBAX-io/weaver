/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { logout, loadWallets } from '../actions';
import { discoverNetwork, initialize } from 'modules/engine/actions';

const reloadWalletsEpic: Epic = (action$, store) => action$.ofType(logout.done.type, discoverNetwork.done.type, initialize.done.type)
    .filter(l => {
        const session = store.getState().engine.guestSession;
        return !!(session && store.getState().storage.networks.find(n => n.uuid === session.network.uuid));

    }).map(action => loadWallets.started(null));

export default reloadWalletsEpic;