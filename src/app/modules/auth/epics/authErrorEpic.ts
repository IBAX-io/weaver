/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { login, importWallet, createWallet } from '../actions';
import { modalShow } from 'modules/modal/actions';

const authErrorEpic: Epic = (action$, store) => action$.ofType(login.failed.type, importWallet.failed.type, createWallet.failed.type)
    .map(action =>
        modalShow({
            id: 'AUTH_ERROR',
            type: 'AUTH_ERROR',
            params: {
                error: (action as any).payload.error
            }
        })
    );

export default authErrorEpic;