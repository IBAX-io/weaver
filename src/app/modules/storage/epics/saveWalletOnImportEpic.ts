/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { addModuleWallet, importWallet } from 'modules/auth/actions';
import { saveWallet } from '../actions';

const saveWalletOnImportEpic: Epic = action$ => action$.pipe(
    ofAction(importWallet.done, addModuleWallet.done),
    map(action =>
        saveWallet(action.payload.result)
    )
);

export default saveWalletOnImportEpic;
