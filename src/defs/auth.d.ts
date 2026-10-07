/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/auth' {
  import { IAccount, IKeyInfo, IRoleInfo, IEcosystemInfo } from 'ibax/api';

  interface INetworkEndpoint {
    uuid: string;
    apiHost: string;
  }

  interface INetwork {
    uuid: string;
    id: number;
    name: string;
    honorNodes: string[];
    disableSync?: boolean;
    socketUrl?: string;
    activationEmail?: string;
    demoEnabled?: boolean;
    // The network's block explorer API (scan.ibax.network's /api/v2), which indexes every account's
    // transactions; the node keeps no list of an account's UTXO transfers
    explorer?: string;
  }

  interface IWalletIdentity {
    publicKey: string;
    keyID: string;
  }

  // Keyed by crypto suite ("ECC_Secp256k1/KECCAK256", ...)
  interface IWalletIdentities {
    [suite: string]: IWalletIdentity;
  }

  interface IWallet {
    id: string;
    encKey: string;
    identities: IWalletIdentities;
  }

  interface ISession {
    network: INetworkEndpoint;
    sessionToken: string;
    cryptoSuite: import('ibax/crypto').ICryptoSuiteId;
  }

  interface IAccountContext {
    wallet: IAccount;
    access: IEcosystemInfo;
    role?: IRoleInfo;
  }

  interface ILoginCall {
    password: string;
  }

  interface ICreateWalletCall {
    seed: string;
    password: string
  }

  interface IImportWalletCall {
    backup: string;
    password: string;
  }
}