/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers';
import * as actions from './actions';
import { IWallet, INetwork } from 'ibax/auth';
import saveLocaleHandler from './reducers/saveLocaleHandler';
import saveWalletHandler from './reducers/saveWalletHandler';
import removeWalletHandler from './reducers/removeWalletHandler';
import mergeHonorNodesHandler from './reducers/mergeHonorNodesHandler';
import closeSecurityWarningHandler from './reducers/closeSecurityWarningHandler';
import saveNetworkHandler from './reducers/saveNetworkHandler';
import removeNetworkHandler from './reducers/removeNetworkHandler';
import savePreconfiguredNetworksHandler from './reducers/savePreconfiguredNetworksHandler';
import rehydrateHandler from './reducers/rehydrateHandler';
import setMenuFoldedHandler from './reducers/setMenuFoldedHandler';

export type State = {
  readonly locale: string;
  readonly wallets: IWallet[];
  readonly networks: INetwork[];
  readonly securityWarningClosed: boolean;
  readonly menuFolded: boolean;
};

export const initialState: State = {
  locale: null,
  wallets: [],
  networks: [],
  securityWarningClosed: false,
  menuFolded: false
};

export default reducerWithInitialState<State>(initialState)
  .case(actions.saveLocale, saveLocaleHandler)
  .case(actions.saveWallet, saveWalletHandler)
  .case(actions.removeWallet, removeWalletHandler)
  .case(actions.mergeHonorNodes, mergeHonorNodesHandler)
  .case(actions.closeSecurityWarning, closeSecurityWarningHandler)
  .case(actions.saveNetwork, saveNetworkHandler)
  .case(actions.removeNetwork, removeNetworkHandler)
  .case(actions.savePreconfiguredNetworks, savePreconfiguredNetworksHandler)
  .case(actions.localstorageInit, rehydrateHandler)
  .case(actions.setMenuFolded, setMenuFoldedHandler);