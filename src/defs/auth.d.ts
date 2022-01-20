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
  }

  interface IWallet {
    id: string;
    encKey: string;
    publicKey: string;
  }

  interface ISaveEncKeyCall {
    id: string;
    encKey: string;
  }

  interface ISession {
    network: INetworkEndpoint;
    sessionToken: string;
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
    isDefault?: boolean
  }
}