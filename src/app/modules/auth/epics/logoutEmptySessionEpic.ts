/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'typescript-fsa';
import { defer, of } from 'rxjs';
import { catchError, exhaustMap, filter, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { sameCryptoSuite } from 'lib/crypto/suites';
import { acquireSession } from '../actions';
import { signedInSession } from '../selectors';
import { isSessionExpiredError, signOutForExpiredSession } from '../util/sessionExpiry';
import { signOutForCryptoChange } from '../util/cryptoChange';

// A request of the signed-in user the node refused for the session's token ends the session. The
// node is asked which algorithms it uses first: a chain redeployed under other ones also drew a
// new token secret, and the change of algorithms is what the user has to know (their address on
// it is another one). A node that does not answer leaves the session as it is: being offline says
// nothing about it.
const logoutEmptySessionEpic: Epic = (action$, state$, { api }) => action$.pipe(
    filter(l => {
        const action = l as Action<any>;

        // Restoring the session decides itself what an error means (acquireSessionEpic)
        if (acquireSession.failed.match(action)) {
            return false;
        }

        return !!signedInSession(state$.value) && isSessionExpiredError(action.payload?.error);
    }),
    // Every request open at the time is refused the same way: one sign-out
    exhaustMap(() => {
        const session = signedInSession(state$.value);
        const client = api({ apiHost: session.network.apiHost });

        return defer(() => client.getUid()).pipe(
            map(uid => sameCryptoSuite(uid.cryptoSuite, session.cryptoSuite)),
            // Not telling: the refusal stands as it is
            catchError(() => of(true)),
            mergeMap(same => of(...(same
                ? signOutForExpiredSession(state$.value, session, 'session')
                : signOutForCryptoChange(state$.value, session, 'session'))))
        );
    })
);

export default logoutEmptySessionEpic;
