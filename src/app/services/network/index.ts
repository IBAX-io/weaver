/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { INetworkEndpoint } from 'ibax/auth';
import IbaxAPI from 'lib/ibaxAPI';
import keyring from 'lib/keyring';
import NetworkError from './errors';

export const discover = async (network: INetworkEndpoint, key: string, networkID?: number) => {
  const client = new IbaxAPI({
    apiHost: network.apiHost
  });

  try {
    var uid = await client.getUid();
  }
  catch {
    throw NetworkError.Offline;
  }

  if ('number' === typeof networkID && uid.networkID !== networkID) {
    throw NetworkError.IDMismatch;
  }

  try {
    const tempClient = client.authorize(uid.token);
    const loginResult = await tempClient.login({
      publicKey: keyring.generatePublicKey(key),
      signature: keyring.sign(uid.uid, key)
    });
    const securedClient = client.authorize(loginResult.token);
    const socketUrl: string | undefined = await client.getConfig({ name: 'centrifugo' }).catch(e => undefined);
    const honorNodesPlain = (await securedClient.getSystemParams({ names: ['honor_nodes'] }))
      .list
      .find(l => 'honor_nodes' === l.name)
      .value;

    try {
      var honorNodes: string[] = JSON.parse(honorNodesPlain)
        .map((l: any) => l.api_address);
    }
    catch {
      honorNodes = [network.apiHost];
    }

    return {
      networkID: uid.networkID,
      socketUrl,
      loginResult,
      honorNodes
    };
  }
  catch {
    throw NetworkError.ServerMisconfiguration;
  }
};