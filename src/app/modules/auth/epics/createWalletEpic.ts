/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { createWallet } from '../actions';
import { navigate } from 'modules/router/actions';
import { createWallet as createStoredWallet, privateKeyFromMnemonic } from 'lib/keyring';

const createWalletEpic: Epic = action$ => action$.pipe(
    ofAction(createWallet.started),
    // Errors are handled per action, so one failed attempt does not end the epic
    mergeMap(action => defer(() => createStoredWallet(privateKeyFromMnemonic(action.payload.seed), action.payload.password)).pipe(
        mergeMap(wallet => of(
            createWallet.done({
                params: action.payload,
                result: wallet
            }),
            navigate({ to: '/' })
        )),
        catchError(() => of(createWallet.failed({
            params: action.payload,
            error: 'E_IMPORT_FAILED'
        })))
    ))
);

export default createWalletEpic;
