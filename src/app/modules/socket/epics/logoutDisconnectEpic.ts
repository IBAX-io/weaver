/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { logout } from 'modules/auth/actions';
import { disconnect } from '../actions';

// Signed out, the connection with the session's token closes
const logoutDisconnectEpic: Epic = action$ => action$.pipe(
    ofAction(logout.done),
    map(() => disconnect.started(null))
);

export default logoutDisconnectEpic;
