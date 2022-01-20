/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { importWallet } from 'modules/auth/actions';
import { saveWallet } from '../actions';

const saveWalletOnImportEpic: Epic = (action$, store) => action$.ofAction(importWallet.done)
    .map(action =>
        saveWallet(action.payload.result)
    );

export default saveWalletOnImportEpic;