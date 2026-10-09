/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { login, loginGuest, importWallet, addModuleWallet, createWallet, E_CRYPTO_CHANGED } from '../actions';
import { modalShow } from 'modules/modal/actions';
import { displayableAuthError } from '../util/authErrors';

const authErrorEpic: Epic = action$ => action$.pipe(
    ofAction(login.failed, loginGuest.failed, importWallet.failed, addModuleWallet.failed, createWallet.failed),
    // The sign-in page says that one (the sign-out that follows would close a modal)
    filter(action => E_CRYPTO_CHANGED !== action.payload.error),
    map(action =>
        modalShow({
            id: 'AUTH_ERROR',
            type: 'AUTH_ERROR',
            params: {
                error: displayableAuthError(action.payload.error)
            }
        })
    )
);

export default authErrorEpic;
