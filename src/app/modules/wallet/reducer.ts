/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import { TTransferCall } from 'ibax/tx';
import { logout } from 'modules/auth/actions';
import { fetchBalance, fetchHistory, fetchUtxoHistory, IBalanceOwner, IHistoryPageRequest, IUtxoHistoryRequest, ISendTransferCall, ITransferResult, IWalletBalance, sendTransfer } from './actions';
import { THistoryEntry, THistoryFilter } from './history';
import { IExplorerCursor, IIncompleteBlock, TUtxoHistoryEntry } from './utxoHistory';

export const sameOwner = (a: IBalanceOwner | null, b: IBalanceOwner) => !!a && a.account === b.account && a.ecosystem === b.ecosystem;

export type State = {
    // The balance and whose it is: a balance of another account or ecosystem is never shown
    readonly balance: (IBalanceOwner & IWalletBalance) | null;
    readonly balancePending: boolean;
    // A failed refresh keeps the last balance (shown as possibly outdated)
    readonly balanceError: string | null;
    readonly transferPending: TTransferCall['type'] | null;
    // Bumped after every confirmed transfer of that kind, so its form can start over
    readonly transfersDone: { readonly [K in TTransferCall['type']]: number };
    // Shown with the balance's token and digits, so it belongs to the balance's owner too
    readonly lastTransfer: { readonly call: ISendTransferCall; readonly result: ITransferResult } | null;
    // The history shown and whose it is, like the balance: the filter asked for, the pages loaded
    // so far, newest first (null until the first one is in), and how many rows are older
    readonly history: (IBalanceOwner & { readonly filter: THistoryFilter, readonly entries: readonly THistoryEntry[] | null, readonly more: number }) | null;
    readonly historyPending: boolean;
    readonly historyError: string | null;
    // The request that failed, to try again as it was (the first page or a next one)
    readonly historyRetry: IHistoryPageRequest | null;
    // The account's UTXO transfers shown and whose they are: the pages loaded so far, newest first
    // (null until the first one is in), where the next one goes on (null at the end), and how many
    // of the account's transactions of every kind were gone through, of how many
    readonly utxoHistory: (IBalanceOwner & {
        readonly entries: readonly TUtxoHistoryEntry[] | null,
        readonly next: IExplorerCursor | null,
        readonly checked: number,
        readonly total: number,
        readonly incomplete: readonly IIncompleteBlock[]
    }) | null;
    readonly utxoHistoryPending: boolean;
    readonly utxoHistoryError: string | null;
    readonly utxoHistoryRetry: IUtxoHistoryRequest | null;
};

export const initialState: State = {
    balance: null,
    balancePending: false,
    balanceError: null,
    transferPending: null,
    transfersDone: { utxo: 0, transferSelf: 0 },
    lastTransfer: null,
    history: null,
    historyPending: false,
    historyError: null,
    historyRetry: null,
    utxoHistory: null,
    utxoHistoryPending: false,
    utxoHistoryError: null,
    utxoHistoryRetry: null
};

const sameCursor = (a: IExplorerCursor | null, b: IExplorerCursor | null) =>
    a === b || (!!a && !!b && a.block === b.block && a.position === b.position && a.skip === b.skip && a.after === b.after);

const sameHistory = (history: State['history'], request: IBalanceOwner & { filter: THistoryFilter }) =>
    sameOwner(history, request) && history.filter === request.filter;

export default reducerWithInitialState<State>(initialState)
    .case(fetchBalance.started, (state, payload) => ({
        ...state,
        balance: sameOwner(state.balance, payload) ? state.balance : null,
        lastTransfer: sameOwner(state.balance, payload) ? state.lastTransfer : null,
        balancePending: true,
        balanceError: null
    }))
    .case(fetchBalance.done, (state, payload) => ({
        ...state,
        balance: { ...payload.params, ...payload.result },
        balancePending: false
    }))
    .case(fetchBalance.failed, (state, payload) => ({
        ...state,
        balance: sameOwner(state.balance, payload.params) ? state.balance : null,
        balancePending: false,
        balanceError: payload.error
    }))
    .case(sendTransfer.started, (state, payload) => ({
        ...state,
        transferPending: payload.transfer.type,
        lastTransfer: null
    }))
    .case(sendTransfer.done, (state, payload) => ({
        ...state,
        transferPending: null,
        transfersDone: { ...state.transfersDone, [payload.params.transfer.type]: state.transfersDone[payload.params.transfer.type] + 1 },
        lastTransfer: { call: payload.params, result: payload.result }
    }))
    .case(sendTransfer.failed, state => ({
        ...state,
        transferPending: null
    }))
    // A next page adds to the rows shown; anything else starts over (another account, ecosystem or
    // filter is never mixed in)
    .case(fetchHistory.started, (state, payload) => ({
        ...state,
        history: sameHistory(state.history, payload)
            ? state.history
            : { account: payload.account, ecosystem: payload.ecosystem, filter: payload.filter, entries: null, more: 0 },
        historyPending: true,
        historyError: null,
        historyRetry: null
    }))
    .case(fetchHistory.done, (state, payload) => {
        const { history } = state;
        // An answer to a request since replaced (another filter, account or ecosystem), or a next
        // page that no longer follows the rows shown, is dropped
        const shown = history && history.entries;
        const follows = null === payload.params.before
            || (!!shown && shown.length > 0 && shown[shown.length - 1].id === payload.params.before);
        if (!sameHistory(history, payload.params) || !follows) {
            return state;
        }
        return {
            ...state,
            history: {
                ...history,
                entries: null === payload.params.before ? payload.result.entries : [...shown, ...payload.result.entries],
                more: payload.result.more
            },
            historyPending: false
        };
    })
    .case(fetchHistory.failed, (state, payload) => sameHistory(state.history, payload.params)
        ? { ...state, historyPending: false, historyError: payload.error, historyRetry: payload.params }
        : state)
    // Like the history: a next page adds to the transfers shown, anything else starts over
    .case(fetchUtxoHistory.started, (state, payload) => ({
        ...state,
        utxoHistory: sameOwner(state.utxoHistory, payload)
            ? state.utxoHistory
            : { account: payload.account, ecosystem: payload.ecosystem, entries: null, next: null, checked: 0, total: 0, incomplete: [] },
        utxoHistoryPending: true,
        utxoHistoryError: null,
        utxoHistoryRetry: null
    }))
    .case(fetchUtxoHistory.done, (state, payload) => {
        const { utxoHistory } = state;
        const { cursor } = payload.params;
        const shown = utxoHistory && utxoHistory.entries;
        // An answer for another account or ecosystem, or a next page that no longer follows the
        // transfers shown, is dropped
        if (!sameOwner(utxoHistory, payload.params) || (null !== cursor && (!shown || !sameCursor(utxoHistory.next, cursor)))) {
            return state;
        }
        const kept = null === cursor ? [] : shown;
        // A transfer is shown once, whatever the explorer answered
        const entries = payload.result.entries.reduce(
            (list, entry) => list.some(old => old.hash === entry.hash) ? list : [...list, entry],
            kept
        );
        // A block gone through over several pages counts the rows of each
        const incomplete = payload.result.incomplete.reduce(
            (list, block) => list.some(old => old.blockID === block.blockID)
                ? list.map(old => old.blockID === block.blockID ? { ...old, count: old.count + block.count } : old)
                : [...list, block],
            null === cursor ? [] : utxoHistory.incomplete
        );
        return {
            ...state,
            utxoHistory: {
                ...utxoHistory,
                entries,
                next: payload.result.next,
                checked: (null === cursor ? 0 : utxoHistory.checked) + payload.result.checked,
                total: payload.result.total,
                incomplete
            },
            utxoHistoryPending: false
        };
    })
    .case(fetchUtxoHistory.failed, (state, payload) => sameOwner(state.utxoHistory, payload.params)
        ? { ...state, utxoHistoryPending: false, utxoHistoryError: payload.error, utxoHistoryRetry: payload.params }
        : state)
    .case(logout.started, () => initialState);
