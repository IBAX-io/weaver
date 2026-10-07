/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import { TTransferCall } from 'ibax/tx';
import { logout } from 'modules/auth/actions';
import { fetchBalance, fetchHistory, IBalanceOwner, ISendTransferCall, ITransferResult, IWalletBalance, sendTransfer } from './actions';
import { THistoryEntry, THistoryFilter } from './history';

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
    historyError: null
};

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
        historyError: null
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
        ? { ...state, historyPending: false, historyError: payload.error }
        : state)
    .case(logout.started, () => initialState);
