/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, of } from 'rxjs';
import { exhaustMap, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { decryptLegacyPrivateKey } from 'lib/crypto/legacyWallet';
import { createWallet } from 'lib/keyring';
import { removeLegacyWallet, saveWallet } from 'modules/storage/actions';
import { upgradeLegacyWallet } from '../actions';
import { promptPassword } from '../util/passwordPrompt';

export const UPGRADE_LEGACY_WALLET_MODAL = 'UPGRADE_LEGACY_WALLET';

// The old password decrypts the old key; the key is stored again the current way, with the same
// password, and the old entry is removed only once the new one is saved. A wallet of the same key
// stored since (imported again, maybe with another password) is kept as it is. One upgrade at a
// time: its prompt has a fixed id, so a second one would take the same answer.
const upgradeLegacyWalletEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(upgradeLegacyWallet.started),
    exhaustMap(action => promptPassword(action$, {
        id: UPGRADE_LEGACY_WALLET_MODAL,
        purpose: 'upgrade',
        decrypt: password => decryptLegacyPrivateKey(action.payload, password),
        withKey: (privateKey, password) => defer(() => createWallet(privateKey, password)).pipe(
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
        ),
        failed: error => upgradeLegacyWallet.failed({ params: action.payload, error })
    }))
);

export default upgradeLegacyWalletEpic;
