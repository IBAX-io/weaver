/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { timer } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { authorize, deauthorize } from '../actions';
import { releaseSigningKey } from '../util/releaseSigningKey';

// The key is locked again an hour after it was unlocked
const authorizeEpic: Epic = (action$, state$, { pkcs11 }) => action$.pipe(
    ofAction(authorize),
    switchMap(action =>
        timer(60000 * 60).pipe(
            map(() => {
                releaseSigningKey(state$.value.auth.signingKey, pkcs11);
                return deauthorize(null);
            }),
            takeUntil(action$.pipe(ofAction(authorize)))
        )
    )
);

export default authorizeEpic;
