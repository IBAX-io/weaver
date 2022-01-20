/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs/Observable';
import { removeWallet } from '../actions';
import { removeWallet as removeStoredWallet } from 'modules/storage/actions';
import { modalClose, modalShow } from 'modules/modal/actions';

const removeWalletEpic: Epic = (action$, store) => action$.ofAction(removeWallet)
    .flatMap(action =>
        Observable.merge(
            Observable.of(modalShow({
                id: 'AUTH_REMOVE_WALLET',
                type: 'AUTH_REMOVE_WALLET',
                params: {
                    wallet: action.payload
                }
            })),
            action$.ofAction(modalClose)
                .take(1)
                .flatMap(result => {
                    if ('RESULT' === result.payload.reason) {
                        return Observable.of(removeStoredWallet(action.payload));
                    }
                    else {
                        return Observable.empty<never>();
                    }
                })
        )
    );

export default removeWalletEpic;