/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { importWallet } from '../actions';
import { Observable } from 'rxjs/Observable';
import { navigate } from 'modules/engine/actions';
import { publicToID } from 'lib/crypto';
import keyring from 'lib/keyring';

const importWalletEpic: Epic = (action$, store, { api }) => action$.ofAction(importWallet.started)
    .flatMap(action => {
        if (!action.payload.backup || action.payload.backup.length !== keyring.KEY_LENGTH) {
            return Observable.of(importWallet.failed({
                params: action.payload,
                error: 'E_INVALID_KEY'
            }));
        }

        const privateKey = action.payload.backup;
        const publicKey = keyring.generatePublicKey(action.payload.backup);
        const encKey = keyring.encryptAES(privateKey, action.payload.password);
        const keyID = publicToID(publicKey);

        return Observable.of<Action>(
            importWallet.done({
                params: action.payload,
                result: {
                    id: keyID,
                    encKey,
                    publicKey
                }
            }),
            navigate('/')
        );

    }).catch(e => Observable.of(importWallet.failed({
        params: null,
        error: 'E_IMPORT_FAILED'
    })));

export default importWalletEpic;