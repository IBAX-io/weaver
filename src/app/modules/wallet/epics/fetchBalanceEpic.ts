/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { fetchBalance } from '../actions';

const fetchBalanceEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(fetchBalance.started),
    switchMap(action => {
        const client = api({ apiHost: state$.value.auth.session.network.apiHost });
        return from(client.getBalance({ wallet: action.payload.account, ecosystem: action.payload.ecosystem })).pipe(
            map(result => fetchBalance.done({ params: action.payload, result })),
            catchError(e => of(fetchBalance.failed({
                params: action.payload,
                error: (e && e.error) || 'E_SERVER'
            })))
        );
    })
);

export default fetchBalanceEpic;
