/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import uuid from 'uuid';
import { defer, merge, of } from 'rxjs';
import { mergeMap, switchMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { modalShow, modalClose } from 'modules/modal/actions';
import { txAuthorize } from '../actions';
import { authorize } from 'modules/auth/actions';
import { decryptPrivateKey, isValidPrivateKey } from 'lib/keyring';
import { enqueueNotification } from 'modules/notifications/actions';

const txAuthorizeEpic: Epic =
    (action$, state$) => action$.pipe(
        ofAction(txAuthorize.started),
        switchMap(action => {
            const state = state$.value;
            if (isValidPrivateKey(state.auth.privateKey)) {
                return of(txAuthorize.done({
                    params: action.payload,
                    result: null
                }));
            }
            else {
                return merge(
                    of(modalShow({
                        id: 'TX_AUTHORIZE',
                        type: 'AUTHORIZE',
                        params: {}
                    })),
                    action$.pipe(
                        ofAction(modalClose),
                        take(1),
                        mergeMap(result => {
                            if (result.payload.data) {
                                return defer(() => decryptPrivateKey(state$.value.auth.wallet.wallet.encKey, result.payload.data).catch(() => null)).pipe(
                                    mergeMap(privateKey => privateKey
                                        ? of(
                                            authorize(privateKey),
                                            txAuthorize.done({
                                                params: action.payload,
                                                result: result.payload.data
                                            })
                                        )
                                        : of(
                                            txAuthorize.failed({
                                                params: action.payload,
                                                error: null
                                            }),
                                            enqueueNotification({
                                                id: uuid.v4(),
                                                type: 'INVALID_PASSWORD',
                                                params: {}
                                            })
                                        )
                                    )
                                );
                            }
                            else {
                                return of(txAuthorize.failed({
                                    params: action.payload,
                                    error: null
                                }));
                            }
                        })
                    )
                );
            }
        })
    );

export default txAuthorizeEpic;
