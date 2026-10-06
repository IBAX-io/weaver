/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { IRootState } from 'modules';
import { unsubscribe } from '../actions';

const unsubscribeEpic: Epic =
    (action$, store) => action$.ofAction(unsubscribe.started)
        .map(action => {
            const sub = store.getState().socket.subscriptions.find(l => l.wallet.id === action.payload.id);
            if (sub) {
                sub.instance.unsubscribe();
                return unsubscribe.done({
                    params: action.payload,
                    result: null
                });
            }
            else {
                return unsubscribe.failed({
                    params: action.payload,
                    error: null
                });
            }
        });

export default unsubscribeEpic;