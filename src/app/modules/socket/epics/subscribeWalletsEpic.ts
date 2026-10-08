/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { subscribe } from '../actions';
import { loadWallets } from 'modules/auth/actions';
import { from } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';

const subscribeWalletsEpic: Epic = action$ => action$.pipe(
    ofAction(loadWallets.done),
    mergeMap(action =>
        from(action.payload.result)
    ),
    filter(account => !!account.address),
    map(account =>
        subscribe.started(account)
    )
);

export default subscribeWalletsEpic;