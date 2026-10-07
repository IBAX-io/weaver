/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat, defer, EMPTY, from, of, timer } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, switchMap, takeUntil, toArray } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { apiErrorCode, InvalidResponseError } from 'lib/ibaxAPI/errors';
import { parseAddress } from 'lib/crypto/address';
import { logout } from 'modules/auth/actions';
import { E_NO_EXPLORER, fetchUtxoHistory, IUtxoHistoryPage, sendTransfer } from '../actions';
import { sameOwner } from '../reducer';
import { findTransfers, IExplorerRow, parseExplorerPage, TExplorerPage, TUtxoHistoryEntry, verifyUtxoTransfer } from '../utxoHistory';

// The node lookups in flight at once
const NODE_LOOKUPS = 5;
// After a UTXO transfer, how long to wait before looking for it again while the explorer has not
// indexed it yet
const INDEXING_RETRIES_MS = [5000, 15000, 45000];

// A page of the account's UTXO transfers: found in the explorer, each one looked up in the node. A
// transfer the node does not know (yet), or records otherwise than the explorer lists it, is shown
// as such, with nothing but its hash and block: what is shown of a transfer is what the chain says.
export const fetchUtxoHistoryEpic: Epic = (action$, state$, { api, explorer }) => action$.pipe(
    ofAction(fetchUtxoHistory.started),
    switchMap(action => {
        const { account, ecosystem, cursor } = action.payload;
        const state = state$.value;
        const session = state.auth.session;
        const network = state.storage.networks.find(item => item.uuid === session.network.uuid);
        const keyID = parseAddress(account);
        if (!network || !network.explorer) {
            return of(fetchUtxoHistory.failed({ params: action.payload, error: E_NO_EXPLORER }));
        }
        if (null === keyID) {
            return of(fetchUtxoHistory.failed({ params: action.payload, error: 'E_INVALIDWALLET' }));
        }
        const index = explorer(network.explorer);
        const read: TExplorerPage = async (page, limit) => {
            const answer = parseExplorerPage(await index.accountTransactions({ wallet: account, ecosystem: Number(ecosystem), page, limit }), limit);
            if (!answer || answer.rows.some(row => row.ecosystem !== ecosystem)) {
                throw new InvalidResponseError('explorer');
            }
            return answer;
        };
        const node = api({ apiHost: session.network.apiHost });
        const lookUp = (row: IExplorerRow) => defer(() => node.txInfo({ hash: row.hash })).pipe(
            map(answer => {
                const transfer = verifyUtxoTransfer(row, answer, keyID);
                const entry: TUtxoHistoryEntry | 'other' = 'unknown' === transfer || 'mismatch' === transfer
                    ? { hash: row.hash, blockID: String(row.block), problem: 'unknown' === transfer ? 'unconfirmed' : 'mismatch' }
                    : transfer;
                return { hash: row.hash, entry };
            })
        );
        return defer(() => findTransfers(read, cursor)).pipe(
            mergeMap(({ found, next, checked, total, incomplete }) => from(found).pipe(
                mergeMap(lookUp, NODE_LOOKUPS),
                toArray(),
                map((answers): IUtxoHistoryPage => ({
                    // In the explorer's order, newest first, whatever order the node answered in; a
                    // transfer between two other accounts is left out
                    entries: found
                        .map(row => answers.find(answer => answer.hash === row.hash).entry)
                        .filter((entry): entry is TUtxoHistoryEntry => 'other' !== entry),
                    next,
                    checked,
                    total,
                    incomplete
                }))
            )),
            map(result => fetchUtxoHistory.done({ params: action.payload, result })),
            catchError(e => of(fetchUtxoHistory.failed({
                params: action.payload,
                error: apiErrorCode(e)
            }))),
            takeUntil(action$.pipe(ofAction(logout.started)))
        );
    })
);

// A UTXO transfer went through: the open wallet's UTXO transfers start over from the newest, and
// again a few times while the explorer has not listed it yet (it indexes the chain behind the node)
export const reloadUtxoHistoryEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(sendTransfer.done),
    switchMap(action => {
        const owner = () => {
            const open = state$.value.auth.wallet;
            const address = open?.wallet?.address;
            const ecosystem = open?.access?.ecosystem;
            const { utxoHistory } = state$.value.wallet;
            return utxoHistory && address && ecosystem && sameOwner(utxoHistory, { account: address, ecosystem }) ? utxoHistory : null;
        };
        const hash = action.payload.result.hash;
        const reload = () => {
            const history = owner();
            return fetchUtxoHistory.started({ account: history.account, ecosystem: history.ecosystem, cursor: null });
        };
        if ('utxo' !== action.payload.params.transfer.type || !owner()) {
            return EMPTY;
        }
        return concat(
            of(reload()),
            from(INDEXING_RETRIES_MS).pipe(
                concatMap(delay => timer(delay)),
                // Until it is listed, while the same wallet is open and nothing is loading
                filter(() => {
                    const history = owner();
                    return !!history && !state$.value.wallet.utxoHistoryPending
                        && !(history.entries || []).some(entry => entry.hash === hash);
                }),
                map(reload)
            )
        ).pipe(takeUntil(action$.pipe(ofAction(logout.started))));
    })
);
