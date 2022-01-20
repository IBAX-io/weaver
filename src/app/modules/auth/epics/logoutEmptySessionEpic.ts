/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'typescript-fsa';
import { Epic } from 'modules';
import { logout } from '../actions';

const logoutEmptySessionEpic: Epic = (action$, store) => action$
    .filter(l => {
        const action = l as Action<any>;

        if (store.getState().auth.isAuthenticated && action.payload && action.payload.error) {
            switch (action.payload.error) {
                case 'E_OFFLINE':
                case 'E_TOKENEXPIRED':
                    return true;

                default:
                    return false;
            }
        }
        else {
            return false;
        }

    }).map(action =>
        logout.started(null)
    );

export default logoutEmptySessionEpic;