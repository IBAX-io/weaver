/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { saveWallet } from '../actions';
import { createWallet } from 'modules/auth/actions';

const saveWalletOnCreateEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(createWallet.done)
        .map(action =>
            saveWallet(action.payload.result)
        );

export default saveWalletOnCreateEpic;