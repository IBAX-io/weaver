/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { importWallet } from '../actions';
import { navigate } from 'modules/router/actions';
import { createWallet, isValidMnemonic, isValidPrivateKey, privateKeyFromMnemonic } from 'lib/keyring';

// The backup is either a raw private key (hex) or a BIP39 mnemonic from an IBAX wallet
export const privateKeyFromBackup = (backup: string): string | null => {
    const value = (backup || '').trim();
    if (isValidPrivateKey(value)) {
        return value.toLowerCase();
    }
    if (isValidMnemonic(value)) {
        return privateKeyFromMnemonic(value);
    }
    return null;
};

const importWalletEpic: Epic = action$ => action$.pipe(
    ofAction(importWallet.started),
    mergeMap(action => {
        const privateKey = privateKeyFromBackup(action.payload.backup);
        if (!privateKey) {
            return of(importWallet.failed({
                params: action.payload,
                error: 'E_INVALID_KEY'
            }));
        }

        // Errors are handled per action, so one failed attempt does not end the epic
        return defer(() => createWallet(privateKey, action.payload.password)).pipe(
            mergeMap(wallet => of(
                importWallet.done({
                    params: action.payload,
                    result: wallet
                }),
                navigate({ to: '/' })
            )),
            catchError(() => of(importWallet.failed({
                params: action.payload,
                error: 'E_IMPORT_FAILED'
            })))
        );
    })
);

export default importWalletEpic;
