/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, EMPTY, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, takeUntil } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { apiErrorCode, InvalidResponseError } from 'lib/ibaxAPI/errors';
import { parseAddress } from 'lib/crypto/address';
import { logout } from 'modules/auth/actions';
import { fetchHistory, sendTransfer, E_INVALIDWALLET } from '../actions';
import { sameOwner } from '../reducer';
import { HISTORY_COLUMNS, HISTORY_PAGE_SIZE, historyQuery, parseHistoryPage } from '../history';
import { signedInSession } from 'modules/auth/selectors';
import { E_SIGNED_OUT } from 'modules/auth/actions';

// A page of the account's history, newest first. A page with a row this page cannot read is
// refused as a whole, like a balance it cannot do arithmetic on: a list with rows quietly left out
// would read as complete. A newer request replaces the one in flight.
export const fetchHistoryEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(fetchHistory.started),
    switchMap(action => {
        const session = signedInSession(state$.value);
        // Signed out of since it was asked for: the node is not asked
        if (!session) {
            return of(fetchHistory.failed({ params: action.payload, error: E_SIGNED_OUT }));
        }
        const { account, ecosystem, filter, before } = action.payload;
        const keyID = parseAddress(account);
        if (null === keyID) {
            return of(fetchHistory.failed({ params: action.payload, error: E_INVALIDWALLET }));
        }
        const client = api({ apiHost: session.network.apiHost, sessionToken: session.sessionToken });
        return defer(() => client.listWhere({
            name: 'history',
            where: historyQuery(keyID, ecosystem, filter, before),
            order: { id: -1 },
            columns: [...HISTORY_COLUMNS],
            // One more than shown: whether there are older rows
            limit: HISTORY_PAGE_SIZE + 1
        })).pipe(
            map(response => {
                const page = parseHistoryPage(response, keyID, before);
                if (!page) {
                    throw new InvalidResponseError('history');
                }
                return fetchHistory.done({ params: action.payload, result: page });
            }),
            catchError(e => of(fetchHistory.failed({ params: action.payload, error: apiErrorCode(e) }))),
            takeUntil(action$.pipe(ofAction(logout.started)))
        );
    })
);

// A transfer went through: the history of the wallet open on the page starts over from its newest
// row, keeping its filter. A move between balances shows there at once (one row, in the block the
// transaction was confirmed in); a UTXO transfer between accounts never does (it writes no row).
export const reloadHistoryEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(sendTransfer.done),
    mergeMap(() => {
        const { history } = state$.value.wallet;
        const open = state$.value.auth.wallet;
        const address = open?.wallet?.address;
        const ecosystem = open?.access?.ecosystem;
        return history && address && ecosystem && sameOwner(history, { account: address, ecosystem })
            ? of(fetchHistory.started({ account: history.account, ecosystem: history.ecosystem, filter: history.filter, before: null }))
            : EMPTY;
    })
);
