/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { subscribe } from '../actions';
import { loadWallet } from 'modules/auth/actions';

const subscribeWalletEpic: Epic = action$ => action$.pipe(
    ofAction(loadWallet),
    map(action =>
        subscribe.started(action.payload)
    )
);

export default subscribeWalletEpic;