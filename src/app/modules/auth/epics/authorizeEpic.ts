/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs/Observable';
import { authorize, deauthorize } from '../actions';

const authorizeEpic: Epic = (action$, store) => action$.ofAction(authorize)
    .switchMap(action =>
        Observable.timer(60000 * 60)
            .map(() => {
                return deauthorize(null);
            })
            .takeUntil(action$.ofAction(authorize))
    );

export default authorizeEpic;