/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { unsubscribe } from '../actions';
import { removeWallet } from 'modules/storage/actions';

const unsubscribeRemovedWalletEpic: Epic<Action, IRootState> = (action$, store) => action$.ofAction(removeWallet)
    .map(action =>
        unsubscribe.started(action.payload)
    );

export default unsubscribeRemovedWalletEpic;