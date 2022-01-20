/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { subscribe } from '../actions';
import { loadWallets } from 'modules/auth/actions';
import { Observable } from 'rxjs';

const subscribeWalletsEpic: Epic = (action$, store) => action$.ofAction(loadWallets.done)
    .flatMap(action =>
        Observable.from(action.payload.result)
    )
    .filter(account => !!account.address)
    .map(account =>
        subscribe.started(account)
    );

export default subscribeWalletsEpic;