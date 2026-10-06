/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import { TTransferCall } from 'ibax/tx';
import { logout } from 'modules/auth/actions';
import { fetchBalance, IBalanceOwner, ISendTransferCall, ITransferResult, IWalletBalance, sendTransfer } from './actions';

const sameOwner = (a: IBalanceOwner | null, b: IBalanceOwner) => !!a && a.account === b.account && a.ecosystem === b.ecosystem;

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
};

export const initialState: State = {
    balance: null,
    balancePending: false,
    balanceError: null,
    transferPending: null,
    transfersDone: { utxo: 0, transferSelf: 0 },
    lastTransfer: null
};

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
    .case(logout.started, () => initialState);
