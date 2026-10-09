/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { addModuleWallet } from '../actions';
import { navigate } from 'modules/router/actions';
import { createModuleWallet } from 'lib/keyring';
import { authFailureCode } from '../util/authErrors';

// The wallet holds where the key is, never the key: there is nothing to encrypt
const addModuleWalletEpic: Epic = action$ => action$.pipe(
    ofAction(addModuleWallet.started),
    mergeMap(action => defer(() => of(createModuleWallet(action.payload))).pipe(
        mergeMap(wallet => of(
            addModuleWallet.done({ params: action.payload, result: wallet }),
            navigate({ to: '/' })
        )),
        catchError(error => of(addModuleWallet.failed({ params: action.payload, error: authFailureCode(error) })))
    ))
);

export default addModuleWalletEpic;
