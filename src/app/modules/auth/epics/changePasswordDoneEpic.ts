/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat, from, merge, of } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { changePassword } from '../actions';
import { modalShow, modalClose } from 'modules/modal/actions';
import { logout } from 'modules/auth/actions';
import { saveWallet } from 'modules/storage/actions';
import keyring from 'lib/keyring';

const changePasswordDoneEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(changePassword.done),
    mergeMap(action => {
        const auth = state$.value.auth;
        const wallet = auth.wallet;
        const wallets = state$.value.storage.wallets;
        const privateKey = keyring.decryptAES(wallet.wallet.encKey, action.payload.result.oldPassword);

        if (!keyring.validatePrivateKey(privateKey)) {
            return concat(
                of(changePassword.failed({
                    params: null,
                    error: 'E_INVALID_PASSWORD'
                })),
                of(modalShow({
                    id: 'AUTH_ERROR',
                    type: 'AUTH_ERROR',
                    params: {
                        error: 'E_INVALID_PASSWORD'
                    }
                }))
            );
        }

        const encKey = keyring.encryptAES(privateKey, action.payload.result.newPassword);

        return concat(

            from(wallets.filter(l => l.id === wallet.wallet.id)).pipe(
                map(w => saveWallet({
                    ...w,
                    encKey
                }))
            ),

            merge(
                of(modalShow({
                    id: 'AUTH_PASSWORD_CHANGED',
                    type: 'AUTH_PASSWORD_CHANGED',
                    params: {}
                })),
                action$.pipe(
                    ofAction(modalClose),
                    take(1),
                    mergeMap(result => {
                        return of(logout.started(null));
                    })
                )
            )
        );
    })
);

export default changePasswordDoneEpic;
