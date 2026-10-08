/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { ILegacyWallet } from 'lib/crypto/legacyWallet';
import { IWallet, ILoginCall, ISession, IAccountContext } from 'ibax/auth';
import { ICreateWalletCall, IImportWalletCall } from 'ibax/auth';
import { IAccount } from 'ibax/api';

const actionCreator = actionCreatorFactory('auth');
export const acquireSession = actionCreator.async<ISession, boolean>('ACQUIRE_SESSION');
export const login = actionCreator.async<ILoginCall, { privateKey: string, publicKey: string, session: ISession }, string>('LOGIN');
export const loginGuest = actionCreator.async<void, { privateKey: string, publicKey: string, wallet: IAccountContext, session: ISession }, string>('LOGIN_GUEST');
export const logout = actionCreator.async('LOGOUT');
export const inviteEcosystem = actionCreator<{ ecosystem: string, redirectPage?: string }>('INVITE_ECOSYSTEM');
export const createWallet = actionCreator.async<ICreateWalletCall, IWallet, string>('CREATE_WALLET');
// Re-encrypts a wallet stored by an earlier version (asks for its password)
export type TUpgradeLegacyWalletError = 'E_INVALID_PASSWORD' | 'E_SERVER' | 'E_CANCELLED';
export const upgradeLegacyWallet = actionCreator.async<ILegacyWallet, IWallet, TUpgradeLegacyWalletError>('UPGRADE_LEGACY_WALLET');
// Adds a stored wallet's identity on the current network's crypto suite, which a wallet stored
// before the client supported that suite lacks (asks for its password)
export type TEnableWalletError = 'E_INVALID_PASSWORD' | 'E_SERVER' | 'E_CANCELLED';
export const enableWalletOnNetwork = actionCreator.async<IWallet, IWallet, TEnableWalletError>('ENABLE_WALLET_ON_NETWORK');
export const importWallet = actionCreator.async<IImportWalletCall, IWallet, string>('IMPORT_WALLET');
export const removeWallet = actionCreator<IAccount>('REMOVE_WALLET');
export const selectWallet = actionCreator<IAccountContext>('SELECT_WALLET');
export const switchWallet = actionCreator<{ ecosystem: string, role: string }>('SWITCH_WALLET');
export const authorize = actionCreator<string>('AUTHORIZE');
export const deauthorize = actionCreator('DEAUTHORIZE');
// done: the key the change-password modal already decrypted with the old password, and the new one
export const changePassword = actionCreator.async<void, { privateKey: string, newPassword: string }, string>('CHANGE_PASSWORD');
// Never fails: a wallet whose accounts cannot be loaded is listed as a placeholder (loadWalletsEpic)
export const loadWallets = actionCreator.async<void, IAccount[]>('LOAD_WALLETS');
export const loadWallet = actionCreator<IAccount>('LOAD_WALLET');
export const backupAccount = actionCreator('BACKUP_ACCOUNT');