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

  // Keyed by crypto suite ("ECC_Secp256k1/KECCAK256", ...). Null: the key lies outside that suite's
  // curve, so the account has no address on its networks. Missing: computed by a client that did
  // not support the suite yet (set up with the password: enableWalletOnNetwork).
  interface IWalletIdentities {
    [suite: string]: IWalletIdentity | null;
  }

  // A key that stays in a PKCS#11 module (desktop app): the wallet holds where it is, not the key
  interface IModuleKeyRef {
    token: { serial: string, label: string };
    // CKA_ID, hex
    id: string;
    label: string;
    cryptoer: import('ibax/pkcs11').TModuleCryptoer;
    // Hex, as the module reports it (IPkcs11Key)
    publicKey: string;
  }

  interface IWallet {
    id: string;
    // Empty for a module wallet
    encKey: string;
    identities: IWalletIdentities;
    module?: IModuleKeyRef;
  }

  interface ISession {
    network: INetworkEndpoint;
    sessionToken: string;
    cryptoSuite: import('ibax/crypto').ICryptoSuiteId;
    // The network runs in FIPS 140-3 mode (/getuid): only module keys sign for it
    fips?: boolean;
    // A signed-in session's token for Centrifugo (notify_key), which connects to the account's
    // notifications until the session expires
    notifyKey?: string;
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