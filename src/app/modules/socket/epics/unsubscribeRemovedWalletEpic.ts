/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { unsubscribe } from '../actions';
import { removeWallet } from 'modules/storage/actions';

const unsubscribeRemovedWalletEpic: Epic = action$ => action$.pipe(
    ofAction(removeWallet),
    map(action =>
        unsubscribe.started(action.payload)
    )
);

export default unsubscribeRemovedWalletEpic;