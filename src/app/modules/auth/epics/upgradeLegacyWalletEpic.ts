/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { defer, Observable, of } from 'rxjs';
import { catchError, exhaustMap, mergeMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { decryptLegacyPrivateKey } from 'lib/crypto/legacyWallet';
import { createWallet } from 'lib/keyring';
import { modalShow } from 'modules/modal/actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { removeLegacyWallet, saveWallet } from 'modules/storage/actions';
import { enqueueNotification } from 'modules/notifications/actions';
import { upgradeLegacyWallet } from '../actions';

export const UPGRADE_LEGACY_WALLET_MODAL = 'UPGRADE_LEGACY_WALLET';

// The old password decrypts the old key; the key is stored again the current way, with the same
// password, and the old entry is removed only once the new one is saved. A wallet of the same key
// stored since (imported again, maybe with another password) is kept as it is. One upgrade at a
// time: its prompt has a fixed id, so a second one would take the same answer.
const upgradeLegacyWalletEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(upgradeLegacyWallet.started),
    exhaustMap(action => ModalObservable<string>(action$, {
        modal: { id: UPGRADE_LEGACY_WALLET_MODAL, type: 'AUTHORIZE', secret: true, params: { purpose: 'upgrade' } },
        success: password => defer(() => decryptLegacyPrivateKey(action.payload, password)).pipe(
            mergeMap((privateKey): Observable<Action> => privateKey
                ? defer(() => createWallet(privateKey, password)).pipe(
                    mergeMap(wallet => {
                        const stored = state$.value.storage.wallets.find(l => l.id === wallet.id);
                        return stored
                            ? of(
                                removeLegacyWallet(action.payload.encKey),
                                upgradeLegacyWallet.done({ params: action.payload, result: stored })
                            )
                            : of(
                                saveWallet(wallet),
                                removeLegacyWallet(action.payload.encKey),
                                upgradeLegacyWallet.done({ params: action.payload, result: wallet })
                            );
                    })
                )
                : of(
                    upgradeLegacyWallet.failed({ params: action.payload, error: 'E_INVALID_PASSWORD' }),
                    enqueueNotification({ id: uuid.v4(), type: 'INVALID_PASSWORD', params: {} })
                )
            ),
            catchError(() => of(
                upgradeLegacyWallet.failed({ params: action.payload, error: 'E_SERVER' }),
                modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: 'E_SERVER' } })
            ))
        ),
        failure: () => of(upgradeLegacyWallet.failed({ params: action.payload, error: 'E_CANCELLED' }))
    }))
);

export default upgradeLegacyWalletEpic;
