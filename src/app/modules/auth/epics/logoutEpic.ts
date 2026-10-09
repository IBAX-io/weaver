/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { logout, deauthorize } from '../actions';
import { closeAllEditorTabs } from 'modules/editor/actions';
import { releaseSigningKey } from '../util/releaseSigningKey';

const logoutEpic: Epic = (action$, state$, { pkcs11 }) => action$.pipe(
    ofAction(logout.started),
    mergeMap(action => {
        releaseSigningKey(state$.value.auth.signingKey, pkcs11);
        return of(
            deauthorize(null),
            closeAllEditorTabs(),
            logout.done({
                params: action.payload,
                result: null
            })
        );
    })
);

export default logoutEpic;
