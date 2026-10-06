/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, merge, of } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { removeWallet } from '../actions';
import { removeWallet as removeStoredWallet } from 'modules/storage/actions';
import { modalClose, modalShow } from 'modules/modal/actions';
import { unsubscribe } from 'modules/socket/actions';

const removeWalletEpic: Epic = action$ => action$.pipe(
    ofAction(removeWallet),
    mergeMap(action =>
        merge(
            of(modalShow({
                id: 'AUTH_REMOVE_WALLET',
                type: 'AUTH_REMOVE_WALLET',
                params: {
                    wallet: action.payload
                }
            })),
            action$.pipe(
                ofAction(modalClose),
                take(1),
                mergeMap(result => {
                    if ('RESULT' === result.payload.reason) {
                        return of(
                            removeStoredWallet(action.payload.walletID),
                            unsubscribe.started(action.payload)
                        );
                    }
                    else {
                        return EMPTY;
                    }
                })
            )
        )
    )
);

export default removeWalletEpic;
