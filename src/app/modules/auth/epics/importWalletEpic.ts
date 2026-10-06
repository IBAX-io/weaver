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
import { publicToID } from 'lib/crypto';
import keyring from 'lib/keyring';

const importWalletEpic: Epic = action$ => action$.pipe(
    ofAction(importWallet.started),
    // Errors are handled per action, so one failed attempt does not end the epic
    mergeMap(action => defer(() => {
        if (!action.payload.backup || action.payload.backup.length !== keyring.KEY_LENGTH) {
            return of(importWallet.failed({
                params: action.payload,
                error: 'E_INVALID_KEY'
            }));
        }

        const privateKey = action.payload.backup;
        const publicKey = keyring.generatePublicKey(action.payload.backup);
        const encKey = keyring.encryptAES(privateKey, action.payload.password);
        const keyID = publicToID(publicKey);

        return of(
            importWallet.done({
                params: action.payload,
                result: {
                    id: keyID,
                    encKey,
                    publicKey
                }
            }),
            navigate({ to: '/' })
        );

    }).pipe(
        catchError(() => of(importWallet.failed({
            params: action.payload,
            error: 'E_IMPORT_FAILED'
        })))
    ))
);

export default importWalletEpic;
