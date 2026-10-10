/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { defer, EMPTY, of } from 'rxjs';
import { catchError, filter, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { acquireSession } from 'modules/auth/actions';
import { isSignedInSession } from 'modules/auth/selectors';
import { connect } from '../actions';

// A signed-in session connects to Centrifugo once the node took it (signed in, or restored), with
// its own token: the connection gets the account's notifications only. The network's socketUrl,
// when set, is where the node's Centrifugo is reached from the client.
const sessionConnectEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(acquireSession.done),
    filter(action => {
        const state = state$.value;
        const session = action.payload.params;
        return isSignedInSession(state, session) &&
            !!session.notifyKey &&
            state.socket.session !== session.sessionToken;
    }),
    mergeMap(action => {
        const session = action.payload.params;
        const network = state$.value.storage.networks.find(n => n.uuid === session.network.uuid);
        const url = network && network.socketUrl
            ? of(network.socketUrl)
            : defer(() => api({ apiHost: session.network.apiHost }).getCentrifugo()).pipe(map(endpoint => endpoint.url));

        return url.pipe(
            map(address => connect.started({
                url: address,
                token: session.notifyKey,
                session: session.sessionToken
            })),
            catchError(() => EMPTY)
        );
    })
);

export default sessionConnectEpic;
