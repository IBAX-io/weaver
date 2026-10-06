
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, from } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loadWallet } from '../actions';
import { saveWallet } from 'modules/storage/actions';

const loadSavedWalletEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(saveWallet),
    mergeMap(action => {
        const network = state$.value.engine.guestSession.network;
        const client = api({ apiHost: network.apiHost });

        return from(client.keyinfo({
            id: action.payload.id

        })).pipe(
            map(account => loadWallet({
                id: action.payload.id,
                address: account.account,
                encKey: action.payload.encKey,
                publicKey: action.payload.publicKey,
                access: account.ecosystems.map(key => ({
                    ...key,
                    roles: key.roles || []
                }))

            })),
            catchError(e => EMPTY)
        );
    })
);

export default loadSavedWalletEpic;
