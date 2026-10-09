/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { ILegacyWallet } from 'lib/crypto/legacyWallet';
import { IWallet, ILoginCall, ISession, IAccountContext, IModuleKeyRef } from 'ibax/auth';
import { ICreateWalletCall, IImportWalletCall } from 'ibax/auth';
import { IAccount } from 'ibax/api';
import { TPasswordPromptError } from './util/passwordPrompt';
import { TSigningKey } from 'lib/crypto/signer';

const actionCreator = actionCreatorFactory('auth');
export const acquireSession = actionCreator.async<ISession, boolean>('ACQUIRE_SESSION');
// signingKey: the wallet's key, unlocked (a key in memory) or logged in to (a key in a module)
export const login = actionCreator.async<ILoginCall, { signingKey: TSigningKey, publicKey: string, session: ISession }, string>('LOGIN');
// signingKey: null on a FIPS network, where the guest's session is not signed for
export const loginGuest = actionCreator.async<void, { signingKey: TSigningKey | null, publicKey: string, wallet: IAccountContext, session: ISession }, string>('LOGIN_GUEST');
export const logout = actionCreator.async('LOGOUT');
// The network's key algorithms are no longer the ones the session signed in under (its address and
// signatures would be the old ones): the session ends, the network is connected to again, and the
// sign-in page of that network says why.
export const E_CRYPTO_CHANGED = 'E_CRYPTO_CHANGED';
// The node no longer accepts the session's token (util/sessionExpiry.ts): the session ends, and the
// sign-in page of that network says why.
export const E_TOKENEXPIRED = 'E_TOKENEXPIRED';
// Asked of the node for a session signed out of since: nothing is asked, nothing is shown
export const E_SIGNED_OUT = 'E_SIGNED_OUT';
export type TSignOutReason = typeof E_CRYPTO_CHANGED | typeof E_TOKENEXPIRED;
// `during`: found when a session was restored or signed in with, or when the node refused
// transactions (those not sent yet were cancelled)
export interface ISignOutReason<R extends TSignOutReason = TSignOutReason> {
    reason: R;
    network: string;
    during: 'session' | 'send';
}
export const cryptoChanged = actionCreator<ISignOutReason<typeof E_CRYPTO_CHANGED>>('CRYPTO_CHANGED');
export const sessionExpired = actionCreator<ISignOutReason<typeof E_TOKENEXPIRED>>('SESSION_EXPIRED');
export const inviteEcosystem = actionCreator<{ ecosystem: string, redirectPage?: string }>('INVITE_ECOSYSTEM');
export const createWallet = actionCreator.async<ICreateWalletCall, IWallet, string>('CREATE_WALLET');
// Re-encrypts a wallet stored by an earlier version (asks for its password)
export const upgradeLegacyWallet = actionCreator.async<ILegacyWallet, IWallet, TPasswordPromptError>('UPGRADE_LEGACY_WALLET');
// Adds a stored wallet's identity on the current network's crypto suite, which a wallet stored
// before the client supported that suite lacks (asks for its password)
export const enableWalletOnNetwork = actionCreator.async<IWallet, IWallet, TPasswordPromptError>('ENABLE_WALLET_ON_NETWORK');
export const importWallet = actionCreator.async<IImportWalletCall, IWallet, string>('IMPORT_WALLET');
// Stores a wallet for a key that stays in a PKCS#11 module (desktop app)
export const addModuleWallet = actionCreator.async<IModuleKeyRef, IWallet, string>('ADD_MODULE_WALLET');
export const removeWallet = actionCreator<IAccount>('REMOVE_WALLET');
export const selectWallet = actionCreator<IAccountContext>('SELECT_WALLET');
export const switchWallet = actionCreator<{ ecosystem: string, role: string }>('SWITCH_WALLET');
export const authorize = actionCreator<TSigningKey>('AUTHORIZE');
export const deauthorize = actionCreator('DEAUTHORIZE');
// done: the key the change-password modal already decrypted with the old password, and the new one
export const changePassword = actionCreator.async<void, { privateKey: string, newPassword: string }, string>('CHANGE_PASSWORD');
// Never fails: a wallet whose accounts cannot be loaded is listed as a placeholder (loadWalletsEpic)
export const loadWallets = actionCreator.async<void, IAccount[]>('LOAD_WALLETS');
export const loadWallet = actionCreator<IAccount>('LOAD_WALLET');
export const backupAccount = actionCreator('BACKUP_ACCOUNT');