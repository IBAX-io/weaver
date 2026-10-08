/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { login } from '../actions';
import { Reducer } from 'modules';

const loginDoneHandler: Reducer<typeof login.done, State> = (state, payload) => ({
    ...state,
    isAuthenticated: true,
    isLoggingIn: false,
    ecosystem: state.wallet.access.ecosystem,
    session: payload.result.session,
    privateKey: payload.result.privateKey,
    id: state.wallet.wallet.id,
    isDefaultWallet: false,
    // Signed in again: the reason for the last sign-out is no longer news
    signedOutBecause: null
});

export default loginDoneHandler;