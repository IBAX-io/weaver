/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { unsubscribe } from '../actions';

const unsubscribeEpic: Epic =
    (action$, state$) => action$.pipe(
        ofAction(unsubscribe.started),
        map(action => {
            const sub = state$.value.socket.subscriptions.find(l => l.wallet.id === action.payload.id);
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
        })
    );

export default unsubscribeEpic;