/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { saveWallet } from '../actions';
import { createWallet } from 'modules/auth/actions';

const saveWalletOnCreateEpic: Epic =
    action$ => action$.pipe(
        ofAction(createWallet.done),
        map(action =>
            saveWallet(action.payload.result)
        )
    );

export default saveWalletOnCreateEpic;
