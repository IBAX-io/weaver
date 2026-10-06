/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, merge, of } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { changePassword } from '../actions';
import { modalShow, modalClose } from 'modules/modal/actions';

const changePasswordEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(changePassword.started),
    mergeMap(action => {
        const encKey = state$.value.auth.wallet.wallet.encKey;
        return merge(
            of(modalShow({
                id: 'AUTH_CHANGE_PASSWORD',
                type: 'AUTH_CHANGE_PASSWORD',
                params: {
                    encKey
                }
            })),
            action$.pipe(
                ofAction(modalClose),
                take(1),
                mergeMap(result => {
                    if ('RESULT' === result.payload.reason) {
                        return of(changePassword.done({
                            params: action.payload,
                            result: result.payload.data
                        }));
                    }
                    else {
                        return EMPTY;
                    }
                })
            )
        );
    })
);

export default changePasswordEpic;
