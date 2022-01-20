/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { logout, deauthorize } from '../actions';
import { Observable } from 'rxjs/Observable';
import { closeAllEditorTabs } from 'modules/editor/actions';

const logoutEpic: Epic = (action$, store) => action$.ofAction(logout.started)
    .flatMap(action =>
        Observable.of<Action>(
            deauthorize(null),
            closeAllEditorTabs(),
            logout.done({
                params: action.payload,
                result: null
            })
        )
    );

export default logoutEpic;