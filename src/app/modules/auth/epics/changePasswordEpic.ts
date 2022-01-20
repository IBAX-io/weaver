/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs/Observable';
import { changePassword } from '../actions';
import { modalShow, modalClose } from 'modules/modal/actions';

const changePasswordEpic: Epic = (action$, store, { api }) => action$.ofAction(changePassword.started)
    .flatMap(action => {
        const encKey = store.getState().auth.wallet.wallet.encKey;
        return Observable.merge(
            Observable.of(modalShow({
                id: 'AUTH_CHANGE_PASSWORD',
                type: 'AUTH_CHANGE_PASSWORD',
                params: {
                    encKey
                }
            })),
            action$.ofAction(modalClose)
                .take(1)
                .flatMap(result => {
                    if ('RESULT' === result.payload.reason) {
                        return Observable.of(changePassword.done({
                            params: action.payload,
                            result: result.payload.data
                        }));
                    }
                    else {
                        return Observable.empty<never>();
                    }
                })
        );
    });

export default changePasswordEpic;