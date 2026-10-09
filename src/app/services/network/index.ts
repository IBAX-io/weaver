/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { INetworkEndpoint } from 'ibax/auth';
import IbaxAPI from 'lib/ibaxAPI';
import { UnsupportedCryptoSuiteError } from 'lib/crypto/suites';
import { authenticateGuest } from 'services/auth';
import NetworkError from './errors';
import { UntrustedNodeError } from 'lib/ibaxAPI/errors';

// Connects to a node as the guest (services/auth authenticateGuest): checks the network id, learns the network's crypto
// suite and its current honor nodes
export const discover = async (network: INetworkEndpoint, key: string, networkID?: number) => {
  const client = new IbaxAPI({
    apiHost: network.apiHost
  });

  let uid;
  try {
    uid = await client.getUid();
  }
  catch (e) {
    throw e instanceof UntrustedNodeError ? NetworkError.ServerMisconfiguration : NetworkError.Offline;
  }

  if ('number' === typeof networkID && uid.networkID !== networkID) {
    throw NetworkError.IDMismatch;
  }

  let login;
  try {
    // The network this node said it belongs to, unless the caller knows which one it wants
    login = await authenticateGuest(client, key, { networkID: 'number' === typeof networkID ? networkID : uid.networkID });
  }
  catch (e) {
    throw e instanceof UnsupportedCryptoSuiteError ? NetworkError.UnsupportedCrypto : NetworkError.ServerMisconfiguration;
  }

  try {
    const securedClient = client.authorize(login.result.token);
    const socketUrl: string | undefined = await client.getConfig({ name: 'centrifugo' }).catch(() => undefined);
    const honorNodesPlain = (await securedClient.getSystemParams({ names: ['honor_nodes'] }))
      .list
      .find(l => 'honor_nodes' === l.name)
      .value;

    let honorNodes: string[];
    try {
      honorNodes = JSON.parse(honorNodesPlain).map((l: { api_address: string }) => l.api_address);
    }
    catch {
      honorNodes = [network.apiHost];
    }

    return {
      networkID: uid.networkID,
      cryptoSuite: login.cryptoSuite,
      fips: login.fips,
      socketUrl,
      loginResult: login.result,
      honorNodes
    };
  }
  catch {
    throw NetworkError.ServerMisconfiguration;
  }
};
