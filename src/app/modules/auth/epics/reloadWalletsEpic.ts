/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { ofType } from 'redux-observable';
import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { logout, loadWallets } from '../actions';
import { discoverNetwork, initialize } from 'modules/engine/actions';

const reloadWalletsEpic: Epic = (action$, state$) => action$.pipe(
    ofType<Action, string, Action>(logout.done.type, discoverNetwork.done.type, initialize.done.type),
    filter(l => {
        const session = state$.value.engine.guestSession;
        return !!(session && state$.value.storage.networks.find(n => n.uuid === session.network.uuid));

    }),
    map(action => loadWallets.started(null))
);

export default reloadWalletsEpic;
