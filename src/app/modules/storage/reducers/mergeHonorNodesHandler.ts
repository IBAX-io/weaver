/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { mergeHonorNodes } from '../actions';
import { Reducer } from 'modules';

const mergeHonorNodesHandler: Reducer<typeof mergeHonorNodes, State> = (state, payload) => {
  const network = state.networks.find(l => payload.uuid === l.uuid);

  if (!network) {
    return state;
  }

  const honorNodes = network.disableSync ? network.honorNodes : [
    ...network.honorNodes,
    ...payload.honorNodes
  ].filter((value, index, self) => self.indexOf(value) === index);

  return {
    ...state,
    networks: [
      ...state.networks.filter(l => l.uuid !== network.uuid),
      {
        ...network,
        honorNodes
      }
    ]
  };
};

export default mergeHonorNodesHandler;