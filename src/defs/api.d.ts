/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/api' {
  import { TProtypoElement } from 'ibax/protypo';

  interface IUIDResponse {
    uid: string;
    token: string;
    networkID: number;
  }

  interface ILoginRequest {
    publicKey: string;
    signature: string;
    expire?: number;
    ecosystem?: string;
    role?: number;
  }

  interface ILoginResponse {
    token: string;
    refresh: string;
    notify_key: string;
    timestamp: string;
    key_id: string;
    ecosystem_id: string;
    account: string;
    expiry: number;
    isnode: boolean;
    isowner: boolean;
    roles: {
      role_id: number;
      role_name: string;
    }[];
  }

  interface IAccount {
    id: string;
    address: string;
    encKey: string;
    publicKey: string;
    access: IEcosystemInfo[];
  }

  interface IRoleInfo {
    id: string;
    name: string;
  }

  interface IEcosystemInfo {
    ecosystem: string;
    name: string;
    roles: IRoleInfo[];
    notifications: {
      role_id: string;
      count: string;
    }[];
  }

  interface IKeyInfo {
    account: string;
    ecosystems: IEcosystemInfo[];
  }

  interface ISystemParamsRequest {
    names: string[];
  }

  interface ISystemParamsResponse {
    list: {
      name: string;
      value: string;
      conditions: string;
    }[];
  }

  type TConfigRequest =
    'centrifugo'

  interface IContractRequest {
    name: string;
  }

  type TContractFieldType =
    'bool' | 'int' | 'float' | 'money' | 'string' | 'file' | 'array';

  interface IContractResponse {
    id: number;
    name: string;
    active: boolean;
    tableid: number;
    fields: {
      name: string;
      type: TContractFieldType;
      optional: boolean;
    }[];
  }

  interface IContractsResponse {
    count: number;
    list: {
      id: string;
      name: string;
      value: string;
      wallet_id: string;
      address: string;
      conditions: string;
      token_id: string;
      active: string;
    }[];
  }

  interface IParamRequest {
    name: string;
  }

  interface IParamResponse {
    id: string;
    name: string;
    value: string;
    conditions: string;
  }

  interface IParamsRequest {
    names?: string[];
  }

  interface IParamsResponse {
    list: IParamResponse[];
  }

  interface IRowRequest {
    id: string;
    table: string;
    columns?: string[];
  }

  interface IRowResponse {
    id: string;
    value: {
      [key: string]: any;
    };
  }

  interface ITableRequest {
    name: string;
  }

  interface ITemplateRequest {
    name: string;
  }

  interface ITemplateResponse {
    id: number;
    name: string;
    value: string;
    conditions: string;
  }

  interface IPageResponse extends ITemplateResponse {
    menu: string;
  }

  interface IBlockResponse extends ITemplateResponse {

  }

  interface IMenuResponse extends ITemplateResponse {

  }

  type TContentType =
    'page' | 'block' | 'menu';

  interface IContentRequest {
    type: TContentType;
    name: string;
    locale: string;
    params: {
      [key: string]: any;
    };
  }

  interface IContentResponse {
    menu: string;
    tree: TProtypoElement[];
    menutree?: TProtypoElement[];
    plainText: string;
    nodesCount: number;
  }

  interface IContentTestRequest {
    template: string;
    locale: string;
    params: {
      [key: string]: any;
    };
  }

  interface IContentJsonRequest {
    template: string;
    locale: string;
    source?: boolean;
  }

  interface IContentJsonResponse {
    tree: TProtypoElement[];
  }

  interface IContentHashRequest {
    name: string;
    ecosystem: string;
    walletID: string;
    role: number;
    locale: string;
    params: {
      [key: string]: any;
    };
  }

  interface IContentHashResponse {
    hash: string;
  }

  interface ISegmentRequest {
    offset?: number;
    limit?: number;
  }

  interface ITableResponse {
    name: string;
    insert: string;
    new_column: string;
    update: string;
    conditions: string;
    read?: string;
    filter?: string;
    columns: {
      name: string;
      type: string;
      perm: string;
      index: string;
    }[];
  }

  interface ITablesResponse {
    count: string;
    list: {
      name: string;
      count: string;
    }[];
  }

  interface IDataRequest extends ISegmentRequest {
    name: string;
    columns?: string[];
  }

  interface IDataResponse {
    count: string;
    list: {
      id: string;
      [key: string]: string;
    }[];
  }

  interface ISectionsRequest {
    locale: string;
  }

  interface ISectionResponse {
    id: string;
    ecosystem: string;
    page: string;
    roles_access: string;
    status: string;
    title: string;
    urlname: string;
  }

  interface ISectionsResponse {
    count: string;
    list: ISectionResponse[];
  }

  interface IHistoryRequest extends ISegmentRequest {
    id: string;
    table: string;
  }

  interface IHistoryResponse {
    list: {
      [key: string]: string;
    }[];
  }

  type TTxParams = {
    [key: string]: any;
  };

  type TTxCallRequest<T> = {
    [K in keyof T]: Blob;
  }

  type TTxCallResponse<T> = {
    hashes: {
      [K in keyof T]: string;
    };
  }

  interface ITxStatus {
    penalty: number;
    blockid: string;
    result: string;
    errmsg?: {
      id?: string;

      type: string;
      error: string;
    };
  }

  type TTxStatusRequest<T> =
    Array<keyof T>;

  type TTxStatusResponse<T> = {
    [K in keyof T]: ITxStatus;
  }
}