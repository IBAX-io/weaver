/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { changePassword } from '../actions';
import ModalObservable from 'modules/modal/util/ModalObservable';

const changePasswordEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(changePassword.started),
    mergeMap(action => ModalObservable<{ privateKey: string; newPassword: string }>(action$, {
        modal: {
            id: 'AUTH_CHANGE_PASSWORD',
            type: 'AUTH_CHANGE_PASSWORD',
            secret: true,
            params: {
                encKey: state$.value.auth.wallet.wallet.encKey
            }
        },
        success: result => of(changePassword.done({
            params: action.payload,
            result
        }))
    }))
);

export default changePasswordEpic;
