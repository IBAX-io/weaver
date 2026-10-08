/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers';
import * as actions from './actions';
import { IWallet, INetwork } from 'ibax/auth';
import { isLegacyWallet } from 'lib/crypto/legacyWallet';
import saveLocaleHandler from './reducers/saveLocaleHandler';
import saveWalletHandler from './reducers/saveWalletHandler';
import removeWalletHandler from './reducers/removeWalletHandler';
import mergeHonorNodesHandler from './reducers/mergeHonorNodesHandler';
import closeSecurityWarningHandler from './reducers/closeSecurityWarningHandler';
import saveNetworkHandler from './reducers/saveNetworkHandler';
import removeNetworkHandler from './reducers/removeNetworkHandler';
import savePreconfiguredNetworksHandler from './reducers/savePreconfiguredNetworksHandler';
import setMenuFoldedHandler from './reducers/setMenuFoldedHandler';

export type State = {
  readonly locale: string;
  readonly wallets: IWallet[];
  // Stored by an earlier version and not usable as is: kept untouched until upgraded
  // (lib/crypto/legacyWallet), never dropped
  readonly legacyWallets: unknown[];
  readonly networks: INetwork[];
  readonly securityWarningClosed: boolean;
  readonly menuFolded: boolean;
  // Networks and block explorers the user agreed to send account addresses to (UTXO transfers):
  // modules/wallet/selectors explorerConsent
  readonly explorerAllowed: string[];
};

export const initialState: State = {
  locale: null,
  wallets: [],
  legacyWallets: [],
  networks: [],
  securityWarningClosed: false,
  menuFolded: false,
  explorerAllowed: []
};

export default reducerWithInitialState<State>(initialState)
  .case(actions.saveLocale, saveLocaleHandler)
  .case(actions.saveWallet, saveWalletHandler)
  .case(actions.removeStoredWallet, removeWalletHandler)
  .case(actions.removeLegacyWallet, (state, encKey) => ({
    ...state,
    legacyWallets: state.legacyWallets.filter(wallet => !isLegacyWallet(wallet) || wallet.encKey !== encKey)
  }))
  .case(actions.mergeHonorNodes, mergeHonorNodesHandler)
  .case(actions.closeSecurityWarning, closeSecurityWarningHandler)
  .case(actions.saveNetwork, saveNetworkHandler)
  .case(actions.removeNetwork, removeNetworkHandler)
  .case(actions.savePreconfiguredNetworks, savePreconfiguredNetworksHandler)
  .case(actions.setMenuFolded, setMenuFoldedHandler)
  .case(actions.allowExplorer, (state, consent) => ({
    ...state,
    // Replaces what the user agreed to for the network before: another explorer, or a consent
    // stored by an earlier version (the network's uuid alone)
    explorerAllowed: [...(state.explorerAllowed || []).filter(old => old.split(' ')[0] !== consent.split(' ')[0]), consent]
  }));