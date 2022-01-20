/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { subscribe } from '../actions';
import { loadWallet } from 'modules/auth/actions';

const subscribeWalletEpic: Epic = (action$, store) => action$.ofAction(loadWallet)
    .map(action =>
        subscribe.started(action.payload)
    );

export default subscribeWalletEpic;