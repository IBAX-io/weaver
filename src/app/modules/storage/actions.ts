/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { IWallet, INetwork } from 'ibax/auth';

const actionCreator = actionCreatorFactory('storage');

export const saveLocale = actionCreator<string>('SAVE_LOCALE');
export const saveNetwork = actionCreator<INetwork>('SAVE_NETWORK');
export const savePreconfiguredNetworks = actionCreator<INetwork[]>('SAVE_PRECONFIGURED_NETWORKS');
export const removeNetwork = actionCreator<string>('REMOVE_NETWORK');
export const saveWallet = actionCreator<IWallet>('SAVE_WALLET');
// Payload: the stored wallet's id
export const removeStoredWallet = actionCreator<string>('REMOVE_STORED_WALLET');
// Payload: the encKey of a wallet stored by an earlier version (unique to it)
export const removeLegacyWallet = actionCreator<string>('REMOVE_LEGACY_WALLET');
export const mergeHonorNodes = actionCreator<{ uuid: string, honorNodes: string[] }>('MERGE_HONOR_NODES');
export const closeSecurityWarning = actionCreator<string>('CLOSE_SECURITY_WARNING');
export const setMenuFolded = actionCreator<boolean>('SET_MENU_FOLDED');
// The user agreed to send account addresses to a network's block explorer (explorerConsent)
export const allowExplorer = actionCreator<string>('ALLOW_EXPLORER');