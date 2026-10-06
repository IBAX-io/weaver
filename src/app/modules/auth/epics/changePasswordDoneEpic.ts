/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat, defer, Observable, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Action } from 'redux';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { changePassword } from '../actions';
import { modalShow } from 'modules/modal/actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { logout } from 'modules/auth/actions';
import { saveWallet } from 'modules/storage/actions';
import { encryptPrivateKey, isValidPrivateKey } from 'lib/keyring';

// The change-password modal has decrypted the key with the old password; store it encrypted with
// the new one, then sign out so the next login uses it
const changePasswordDoneEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(changePassword.done),
    mergeMap((action): Observable<Action> => {
        const wallet = state$.value.auth.wallet;
        const wallets = state$.value.storage.wallets;
        const { privateKey, newPassword } = action.payload.result;

        const fail = (error: string) => of(
            changePassword.failed({ params: null, error }),
            modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error } })
        );
        const stored = wallets.find(l => l.id === wallet.wallet.walletID);
        if (!isValidPrivateKey(privateKey)) {
            return fail('E_INVALID_KEY');
        }
        // Never report a new password that was not stored anywhere
        if (!stored) {
            return fail('E_SERVER');
        }

        return defer(() => encryptPrivateKey(privateKey, newPassword)).pipe(
            mergeMap(encKey => concat(
                // Also the signed-in wallet (auth reducer): the old password stops working at once
                of(saveWallet({ ...stored, encKey })),
                // However the notice is closed, the session ends
                ModalObservable(action$, {
                    modal: { id: 'AUTH_PASSWORD_CHANGED', type: 'AUTH_PASSWORD_CHANGED', params: {} },
                    success: () => of(logout.started(null)),
                    failure: () => of(logout.started(null))
                })
            )),
            catchError(() => fail('E_SERVER'))
        );
    })
);

export default changePasswordDoneEpic;
