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
import { Observable } from 'rxjs';

const subscribeReconnectEpic: Epic = (action$, store) => action$.ofAction(connect.done)
    .flatMap(action =>
        Observable.from(store.getState().auth.wallets || [])
    )
    .filter(account => !!account.address)
    .map(account =>
        subscribe.started(account)
    );

export default subscribeReconnectEpic;