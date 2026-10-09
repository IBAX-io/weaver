/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { defer, EMPTY, of } from 'rxjs';
import { catchError, exhaustMap, filter, mergeMap } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { sameNodeCrypto } from 'lib/crypto/signer';
import { reconnected } from 'modules/socket/actions';
import { signedInSession } from '../selectors';
import { signOutForCryptoChange } from '../util/cryptoChange';

// A session left open without sending anything would otherwise keep showing the old address after
// the chain's crypto settings changed: a dropped connection (typically the node restarting with
// the new settings) is the moment to ask the node again. Not answering is no change.
const reconnectCryptoCheckEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(reconnected),
    filter(() => !!signedInSession(state$.value)),
    exhaustMap(() => {
        const session = signedInSession(state$.value);
        const client = api({
            apiHost: session.network.apiHost,
            sessionToken: session.sessionToken
        });

        return defer(() => client.getUid()).pipe(
            mergeMap(uid => sameNodeCrypto(uid, session)
                ? EMPTY
                : of(...signOutForCryptoChange(state$.value, session, 'session'))
            ),
            catchError(() => EMPTY)
        );
    })
);

export default reconnectCryptoCheckEpic;
