/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { createWallet } from '../actions';
import { navigate } from 'modules/engine/actions';
import keyring from 'lib/keyring';
import { publicToID } from 'lib/crypto';

const createWalletEpic: Epic = action$ => action$.pipe(
    ofAction(createWallet.started),
    // Errors are handled per action, so one failed attempt does not end the epic
    mergeMap(action => defer(() => {
        const keys = keyring.generateKeyPair(action.payload.seed);
        const publicKey = keyring.generatePublicKey(keys.private);
        const encKey = keyring.encryptAES(keys.private, action.payload.password);
        const keyID = publicToID(keys.public);

        return of(
            createWallet.done({
                params: action.payload,
                result: {
                    id: keyID,
                    encKey,
                    publicKey
                }
            }),
            navigate('/')
        );

    }).pipe(
        catchError(() => of(createWallet.failed({
            params: action.payload,
            error: 'E_IMPORT_FAILED'
        })))
    ))
);

export default createWalletEpic;
