/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { loginGuest } from '../actions';
import { Reducer } from 'modules';

const loginGuestDoneHandler: Reducer<typeof loginGuest.done, State> = (state, payload) => ({
    ...state,
    isAuthenticated: true,
    isLoggingIn: false,
    ecosystem: '1',
    session: payload.result.session,
    privateKey: payload.result.privateKey,
    wallet: payload.result.wallet,
    isDefaultWallet: true
});

export default loginGuestDoneHandler;