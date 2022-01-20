/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import uuid from 'uuid';
import { IRootState } from 'modules';
import { Epic } from 'redux-observable';
import { Action } from 'redux';
import { Observable } from 'rxjs';
import { modalShow, modalClose } from 'modules/modal/actions';
import { txAuthorize } from '../actions';
import { authorize } from 'modules/auth/actions';
import keyring from 'lib/keyring';
import { enqueueNotification } from 'modules/notifications/actions';

const txAuthorizeEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(txAuthorize.started)
        .switchMap(action => {
            const state = store.getState();
            if (keyring.validatePrivateKey(state.auth.privateKey)) {
                return Observable.of(txAuthorize.done({
                    params: action.payload,
                    result: null
                }));
            }
            else {
                return Observable.merge(
                    Observable.of(modalShow({
                        id: 'TX_AUTHORIZE',
                        type: 'AUTHORIZE',
                        params: {}
                    })),
                    action$.ofAction(modalClose)
                        .take(1)
                        .flatMap(result => {
                            if (result.payload.data) {
                                const privateKey = keyring.decryptAES(store.getState().auth.wallet.wallet.encKey, result.payload.data || '');
                                if (keyring.validatePrivateKey(privateKey)) {
                                    return Observable.of<Action>(
                                        authorize(privateKey),
                                        txAuthorize.done({
                                            params: action.payload,
                                            result: result.payload.data
                                        })
                                    );
                                }
                                else {
                                    return Observable.of<Action>(
                                        txAuthorize.failed({
                                            params: action.payload,
                                            error: null
                                        }),
                                        enqueueNotification({
                                            id: uuid.v4(),
                                            type: 'INVALID_PASSWORD',
                                            params: {}
                                        })
                                    );
                                }
                            }
                            else {
                                return Observable.of(txAuthorize.failed({
                                    params: action.payload,
                                    error: null
                                }));
                            }
                        })
                );
            }
        });

export default txAuthorizeEpic;