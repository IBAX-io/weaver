/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat, defer, from, merge, of } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { changePassword } from '../actions';
import { modalShow, modalClose } from 'modules/modal/actions';
import { logout } from 'modules/auth/actions';
import { saveWallet } from 'modules/storage/actions';
import { decryptPrivateKey, encryptPrivateKey } from 'lib/keyring';

const changePasswordDoneEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(changePassword.done),
    mergeMap(action => {
        const auth = state$.value.auth;
        const wallet = auth.wallet;
        const wallets = state$.value.storage.wallets;
        const { oldPassword, newPassword } = action.payload.result;

        return defer(() => decryptPrivateKey(wallet.wallet.encKey, oldPassword).catch(() => null)).pipe(
            mergeMap(privateKey => {
                if (!privateKey) {
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

                return from(encryptPrivateKey(privateKey, newPassword)).pipe(
                    mergeMap(encKey => concat(
                        from(wallets.filter(l => l.id === wallet.wallet.walletID)).pipe(
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
                                mergeMap(() => of(logout.started(null)))
                            )
                        )
                    ))
                );
            })
        );
    })
);

export default changePasswordDoneEpic;
