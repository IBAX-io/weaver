/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { ofType } from 'redux-observable';
import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { login, importWallet, createWallet } from '../actions';
import { modalShow } from 'modules/modal/actions';
import { displayableAuthError } from '../util/authErrors';

const authErrorEpic: Epic = action$ => action$.pipe(
    ofType<Action, string, Action>(login.failed.type, importWallet.failed.type, createWallet.failed.type),
    map(action =>
        modalShow({
            id: 'AUTH_ERROR',
            type: 'AUTH_ERROR',
            params: {
                error: displayableAuthError((action as ReturnType<typeof login.failed>).payload.error)
            }
        })
    )
);

export default authErrorEpic;
