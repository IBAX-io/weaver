/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { savePreconfiguredNetworks } from '../actions';
import { Reducer } from 'modules';
import { INetwork } from 'ibax/auth';

const savePreconfiguredNetworksHandler: Reducer<typeof savePreconfiguredNetworks, State> = (state, payload) => {
  const preconfigured = payload.map(network => {
    const saved = state.networks.find(l => l.uuid === network.uuid);

    if (saved) {
      return {
        ...saved,
        ...network,
        honorNodes: [
          ...(network.disableSync ? [] : saved.honorNodes),
          ...network.honorNodes
        ].filter((value, index, self) => self.indexOf(value) === index)
      } as INetwork;
    }
    else {
      return network;
    }
  });

  return {
    ...state,
    networks: [
      ...state.networks.filter(l => !preconfigured.find(p => p.uuid === l.uuid)),
      ...preconfigured
    ]
  };
};

export default savePreconfiguredNetworksHandler;