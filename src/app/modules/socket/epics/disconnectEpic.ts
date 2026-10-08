/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { disconnect } from '../actions';

const disconnectEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(disconnect.started),
    map(action => {
        const socket = state$.value.socket.socket;

        if (socket) {
            socket.disconnect();
            return disconnect.done({
                params: action.payload,
                result: null
            });
        }
        else {
            return disconnect.failed({
                params: action.payload,
                error: null
            });
        }
    })
);

export default disconnectEpic;