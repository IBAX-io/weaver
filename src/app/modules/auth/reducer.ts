/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from './actions';
import { ISignOutReason } from './actions';
import { saveWallet } from 'modules/storage/actions';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { ISession, IAccountContext } from 'ibax/auth';
import { IAccount } from 'ibax/api';
import loginHandler from './reducers/loginHandler';
import loginDoneHandler from './reducers/loginDoneHandler';
import loginFailedHandler from './reducers/loginFailedHandler';
import logoutDoneHandler from './reducers/logoutDoneHandler';
import createWalletHandler from './reducers/createWalletHandler';
import createWalletDoneHandler from './reducers/createWalletDoneHandler';
import createWalletFailedHandler from './reducers/createWalletFailedHandler';
import importWalletHandler from './reducers/importWalletHandler';
import importWalletDoneHandler from './reducers/importWalletDoneHandler';
import importWalletFailedHandler from './reducers/importWalletFailedHandler';
import selectWalletHandler from './reducers/selectWalletHandler';
import authorizeHandler from './reducers/authorizeHandler';
import deauthorizeHandler from './reducers/deauthorizeHandler';
import loadWalletsDoneHandler from './reducers/loadWalletsDoneHandler';
import loadWalletHandler from './reducers/loadWalletHandler';
import loginGuestHandler from './reducers/loginGuestHandler';
import loginGuestDoneHandler from './reducers/loginGuestDoneHandler';
import loginGuestFailedHandler from './reducers/loginGuestFailedHandler';
import acquireSessionHandler from './reducers/acquireSessionHandler';
import acquireSessionDoneHandler from './reducers/acquireSessionDoneHandler';
import acquireSessionFailedHandler from './reducers/acquireSessionFailedHandler';
import cryptoChangedHandler from './reducers/cryptoChangedHandler';

export type State = {
    readonly isAcquired: boolean;
    readonly isAuthenticated: boolean;
    readonly isLoggingIn: boolean;
    readonly isCreatingWallet: boolean;
    readonly isDefaultWallet: boolean;
    readonly createWalletError: string;
    readonly isImportingWallet: boolean;
    readonly importWalletError: string;
    readonly id: string;
    // Null when no one is signed in
    readonly session: ISession | null;
    readonly wallet: IAccountContext;
    readonly wallets: IAccount[];
    readonly privateKey: string;
    // Why the user was signed out of which network, shown on its sign-in page until the next sign-in
    readonly signedOutBecause: ISignOutReason | null;
};

export const initialState: State = {
    isAcquired: false,
    isAuthenticated: false,
    isLoggingIn: false,
    isCreatingWallet: false,
    isDefaultWallet: false,
    createWalletError: null,
    isImportingWallet: false,
    importWalletError: null,
    id: null,
    session: null,
    wallet: null,
    privateKey: null,
    wallets: [],
    signedOutBecause: null
};

export default reducerWithInitialState<State>(initialState)
    .case(actions.login.started, loginHandler)
    .case(actions.login.done, loginDoneHandler)
    .case(actions.login.failed, loginFailedHandler)
    .case(actions.loginGuest.started, loginGuestHandler)
    .case(actions.loginGuest.done, loginGuestDoneHandler)
    .case(actions.loginGuest.failed, loginGuestFailedHandler)
    .case(actions.logout.done, logoutDoneHandler)
    .case(actions.createWallet.started, createWalletHandler)
    .case(actions.createWallet.done, createWalletDoneHandler)
    .case(actions.createWallet.failed, createWalletFailedHandler)
    .case(actions.importWallet.started, importWalletHandler)
    .case(actions.importWallet.done, importWalletDoneHandler)
    .case(actions.importWallet.failed, importWalletFailedHandler)
    .case(actions.selectWallet, selectWalletHandler)
    .case(actions.authorize, authorizeHandler)
    .case(actions.deauthorize, deauthorizeHandler)
    .case(actions.loadWallets.done, loadWalletsDoneHandler)
    .case(actions.loadWallet, loadWalletHandler)
    .case(actions.acquireSession.started, acquireSessionHandler)
    .case(actions.acquireSession.done, acquireSessionDoneHandler)
    .case(actions.acquireSession.failed, acquireSessionFailedHandler)
    .case(actions.cryptoChanged, cryptoChangedHandler)
    // The signed-in wallet stored again (a new password): unlocking from now on uses the new key
    .case(saveWallet, (state, wallet) => state.wallet?.wallet.walletID === wallet.id
        ? { ...state, wallet: { ...state.wallet, wallet: { ...state.wallet.wallet, encKey: wallet.encKey } } }
        : state);