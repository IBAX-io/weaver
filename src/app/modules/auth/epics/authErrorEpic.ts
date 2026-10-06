/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { login, loginGuest, importWallet, createWallet } from '../actions';
import { modalShow } from 'modules/modal/actions';
import { displayableAuthError } from '../util/authErrors';

const authErrorEpic: Epic = action$ => action$.pipe(
    ofAction(login.failed, loginGuest.failed, importWallet.failed, createWallet.failed),
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
