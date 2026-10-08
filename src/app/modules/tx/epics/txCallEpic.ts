/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { iif, merge, of } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txCall, txAuthorize, txExec } from '../actions';
import { isType } from 'typescript-fsa';
import { isValidPrivateKey } from 'lib/keyring';

// Every transaction of the app passes here, so this is where it is decided whether it may be
// signed at all. Each call ends in txExec.done or txExec.failed, whatever happens.
const txCallEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(txCall),
    mergeMap(action => {
        // The demo account's key is public: anything signed with it could be changed by anyone
        if (state$.value.auth.isDefaultWallet) {
            return of(txExec.failed({
                params: action.payload,
                error: { type: 'E_GUEST_VIOLATION', error: '' }
            }));
        }

        // Ask for the password if the private key is locked
        return iif(
            () => isValidPrivateKey(state$.value.auth.privateKey),
            of(txExec.started(action.payload)),
            merge(
                of(txAuthorize.started({})),
                action$.pipe(
                    ofAction(txAuthorize.done, txAuthorize.failed),
                    take(1),
                    map(result => isType(result, txAuthorize.done)
                        ? txExec.started(action.payload)
                        // Cancelled, or a wrong password (already reported by txAuthorizeEpic)
                        : txExec.failed({
                            params: action.payload,
                            error: { type: 'E_AUTH_CANCELLED', error: '' }
                        }))
                )
            )
        );
    })
);

export default txCallEpic;
