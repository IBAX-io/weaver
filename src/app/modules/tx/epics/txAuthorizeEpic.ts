/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { Action } from 'redux';
import { defer, Observable, of } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { modalShow } from 'modules/modal/actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { txAuthorize } from '../actions';
import { authorize } from 'modules/auth/actions';
import { decryptPrivateKey, InvalidEncryptedKeyError, isValidPrivateKey } from 'lib/keyring';
import { enqueueNotification } from 'modules/notifications/actions';

const TX_AUTHORIZE_MODAL = 'TX_AUTHORIZE';

const txAuthorizeEpic: Epic =
    (action$, state$) => action$.pipe(
        ofAction(txAuthorize.started),
        switchMap((action): Observable<Action> => {
            const state = state$.value;
            if (isValidPrivateKey(state.auth.privateKey)) {
                return of(txAuthorize.done({
                    params: action.payload
                }));
            }
            else {
                const failed = () => of(txAuthorize.failed({ params: action.payload, error: null }));
                return ModalObservable<string>(action$, {
                    modal: {
                        id: TX_AUTHORIZE_MODAL,
                        type: 'AUTHORIZE',
                        secret: true,
                        params: {}
                    },
                    success: password => password
                        ? defer(() => decryptPrivateKey(state$.value.auth.wallet.wallet.encKey, password)).pipe(
                            mergeMap((privateKey): Observable<Action> => privateKey
                                ? of(
                                    authorize(privateKey),
                                    txAuthorize.done({ params: action.payload })
                                )
                                : of(
                                    txAuthorize.failed({ params: action.payload, error: null }),
                                    enqueueNotification({ id: uuid.v4(), type: 'INVALID_PASSWORD', params: {} })
                                )
                            ),
                            // Not a wrong password: the stored key is corrupt, or decryption failed
                            catchError(error => of(
                                txAuthorize.failed({ params: action.payload, error: null }),
                                modalShow({
                                    id: 'AUTH_ERROR',
                                    type: 'AUTH_ERROR',
                                    params: { error: error instanceof InvalidEncryptedKeyError ? 'E_INVALID_KEY' : 'E_SERVER' }
                                })
                            ))
                        )
                        : failed(),
                    // Pushed aside by another dialog: not the user's choice, so say why nothing happened
                    failure: reason => 'OVERLAP' === reason
                        ? of(
                            txAuthorize.failed({ params: action.payload, error: null }),
                            enqueueNotification({ id: uuid.v4(), type: 'TX_INTERRUPTED', params: {} })
                        )
                        : failed()
                });
            }
        })
    );

export default txAuthorizeEpic;
