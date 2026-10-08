/*
 * @Author: abc
 * @Date: 2020-09-14 17:49:33
 * @LastEditors: abc
 * @LastEditTime: 2020-09-14 18:13:06
 * @Description: 
 */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { subscribe, connect } from '../actions';
import { from } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';

const subscribeReconnectEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(connect.done),
    mergeMap(action =>
        from(state$.value.auth.wallets || [])
    ),
    filter(account => !!account.address),
    map(account =>
        subscribe.started(account)
    )
);

export default subscribeReconnectEpic;