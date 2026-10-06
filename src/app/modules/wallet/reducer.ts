/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers/dist';
import { IBalanceResponse } from 'ibax/api';
import { logout } from 'modules/auth/actions';
import { fetchBalance, IBalanceOwner, sendTransfer } from './actions';

export type State = {
    // The balance and whose it is: a balance of another account or ecosystem is never shown
    readonly balance: (IBalanceOwner & { value: IBalanceResponse }) | null;
    readonly balancePending: boolean;
    readonly balanceError: string | null;
    readonly transferPending: boolean;
    // Bumped after every confirmed transfer, so forms can start over
    readonly transfersDone: number;
};

export const initialState: State = {
    balance: null,
    balancePending: false,
    balanceError: null,
    transferPending: false,
    transfersDone: 0
};

export default reducerWithInitialState<State>(initialState)
    .case(fetchBalance.started, state => ({
        ...state,
        balancePending: true,
        balanceError: null
    }))
    .case(fetchBalance.done, (state, payload) => ({
        ...state,
        balance: { ...payload.params, value: payload.result },
        balancePending: false
    }))
    .case(fetchBalance.failed, (state, payload) => ({
        ...state,
        balance: null,
        balancePending: false,
        balanceError: payload.error
    }))
    .case(sendTransfer.started, state => ({
        ...state,
        transferPending: true
    }))
    .case(sendTransfer.done, state => ({
        ...state,
        transferPending: false,
        transfersDone: state.transfersDone + 1
    }))
    .case(sendTransfer.failed, state => ({
        ...state,
        transferPending: false
    }))
    .case(logout.started, () => initialState);
