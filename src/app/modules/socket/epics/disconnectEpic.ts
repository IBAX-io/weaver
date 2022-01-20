/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { disconnect } from '../actions';

const disconnectEpic: Epic<Action, IRootState> = (action$, store) => action$.ofAction(disconnect.started)
    .map(action => {
        const socket = store.getState().socket.socket;

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
    });

export default disconnectEpic;