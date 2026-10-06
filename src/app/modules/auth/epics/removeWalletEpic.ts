/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { removeWallet } from '../actions';
import { removeStoredWallet } from 'modules/storage/actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { unsubscribe } from 'modules/socket/actions';

const removeWalletEpic: Epic = action$ => action$.pipe(
    ofAction(removeWallet),
    mergeMap(action => ModalObservable(action$, {
        modal: {
            id: 'AUTH_REMOVE_WALLET',
            type: 'AUTH_REMOVE_WALLET',
            params: {
                wallet: action.payload
            }
        },
        success: () => of(
            removeStoredWallet(action.payload.walletID),
            unsubscribe.started(action.payload)
        )
    }))
);

export default removeWalletEpic;
