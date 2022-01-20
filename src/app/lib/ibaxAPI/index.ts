/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import queryString from 'query-string';
import urlJoin from 'url-join';
import urlTemplate from 'url-template';
import { IUIDResponse, ILoginRequest, ILoginResponse, IRowRequest, IRowResponse, IPageResponse, IBlockResponse, IMenuResponse, IContentRequest, IContentResponse, IContentTestRequest, IContentJsonRequest, IContentJsonResponse, ITableResponse, ISegmentRequest, ITablesResponse, IDataRequest, IDataResponse, ISectionsRequest, ISectionsResponse, IHistoryRequest, IHistoryResponse, IParamResponse, IParamsRequest, IParamsResponse, IParamRequest, ITemplateRequest, IContractRequest, IContractResponse, IContractsResponse, ITableRequest, TConfigRequest, ISystemParamsRequest, ISystemParamsResponse, IContentHashRequest, IContentHashResponse, TTxCallRequest, TTxCallResponse, TTxStatusRequest, TTxStatusResponse, ITxStatus, IKeyInfo } from 'ibax/api';

export type TRequestMethod =
  'get' |
  'post';

export interface IRequest {
  method: TRequestMethod;
  url: string;
  headers?: {
    [key: string]: string;
  };
  body?: FormData;
}

export interface IRequestOptions<P, R> {
  headers?: {
    [key: string]: string;
  };
  requestTransformer?: (request: P) => { [key: string]: any };
  responseTransformer?: (response: any, text: string, request: P) => R;
}

export interface IEndpointFactory {
  <R>(method: TRequestMethod, endpoint: string, options?: IRequestOptions<never, R>): IParameterLessEndpoint<R>;
  <P, R>(method: TRequestMethod, endpoint: string, options?: IRequestOptions<P, R>): IEndpoint<P, R>;
}

export interface IEndpoint<P, R> {
  (params: P): Promise<R>;
}

export interface IParameterLessEndpoint<R> {
  (): Promise<R>;
}

export interface IRequestTransport {
  (request: IRequest): Promise<{ json: object, body: string }>;
}

export interface IRequestParams {
  [key: string]: any;
}

export interface ISecuredRequestParams extends IRequestParams {
  session: string;
}

export interface IAPIOptions {
  apiHost: string;
  apiEndpoint?: string;
  transport?: IRequestTransport;
  session?: string;
  requestOptions?: IRequestOptions<any, any>;
}

class IbaxAPI {
  private _defaultOptions: IRequestOptions<any, any> = {};
  private _options: IAPIOptions;

  constructor(options: IAPIOptions) {
    this._options = {
      transport: request => fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body

      }).then(response =>
        Promise.all([
          response.clone().json(),
          response.clone().text()

        ]).then(result => ({
          json: result[0],
          body: result[1]

        }))

      ).catch(e => {
        throw e && e.response && e.response.data ? e.response.data.error : null;
      }),
      apiEndpoint: 'api/v2',
      ...options
    };

    if (options.requestOptions) {
      this._defaultOptions = options.requestOptions;
    }
  }

  protected serializeFormData(values: { [key: string]: any }) {
    const formData = new FormData();
    for (let itr in values) {
      if (values.hasOwnProperty(itr) && values[itr]) {
        formData.append(itr, values[itr]);
      }
    }
    return formData;
  }

  protected request = async <P, R>(method: TRequestMethod, endpoint: string, requestParams: P, options: IRequestOptions<P, R> = {}) => {
    const requestEndpoint = urlTemplate.parse(endpoint).expand(requestParams);
    const requestUrl = urlJoin(this._options.apiHost, this._options.apiEndpoint, requestEndpoint);
    const params = requestParams && options.requestTransformer ? options.requestTransformer(requestParams) : requestParams;

    // TODO: Set request timeout
    const requestOptions: IRequestOptions<P, R> = {
      ...this._defaultOptions,
      ...options
    };

    let json: any = null;
    let text: string = null;

    const query = 'get' === method ? queryString.stringify(params) : '';
    const body = 'get' === method ? null : this.serializeFormData(params);

    try {
      const response = await this._options.transport({
        method,
        url: requestUrl + (query ? '?' + query : ''),
        body,
        headers: requestOptions.headers
      });

      json = response.json;
      text = response.body;
    }
    catch (e) {
      // TODO: Not possible to catch with any other way
      if (!e) {
        json = { error: 'E_OFFLINE' };
      }
      else if (e && e.message && ('Failed to fetch' === e.message || -1 !== e.message.indexOf('ECONNREFUSED'))) {
        json = { error: 'E_OFFLINE' };
      }
      else {
        json = { error: e };
      }
    }

    if (json && json.error) {
      throw json;
    }
    else {
      return requestOptions.responseTransformer ? requestOptions.responseTransformer(json, text, requestParams) : json;
    }
  }

  protected setEndpoint: IEndpointFactory = <P extends IRequestParams, R>(method: TRequestMethod, endpoint: string, options: IRequestOptions<P, R> = {}) => {
    return async (requestParams?: P) => {
      return this.request(method, endpoint, requestParams, options);
    };
  }

  protected setSecuredEndpoint: IEndpointFactory = <P extends IRequestParams, R>(method: TRequestMethod, endpoint: string, options: IRequestOptions<P, R> = {}) => {
    return async (requestParams?: P) => {
      return this.request(method, endpoint, requestParams, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${this._options.session}`
        }
      });
    };
  }

  public to(apiHost: string) {
    return new IbaxAPI({
      ...this._options,
      apiHost
    });
  }

  public authorize(session: string) {
    return new IbaxAPI({
      ...this._options,
      session
    });
  }

  // Authorization
  public getUid = this.setEndpoint<IUIDResponse>('get', 'getuid', {
    requestTransformer: request => null,
    responseTransformer: response => ({
      token: response.token,
      networkID: parseInt(response.network_id, 10),
      uid: 'LOGIN' + response.network_id + response.uid
    })
  });
  public login = this.setSecuredEndpoint<ILoginRequest, ILoginResponse>('post', 'login', {
    requestTransformer: request => ({
      pubkey: request.publicKey,
      signature: request.signature,
      ecosystem: request.ecosystem,
      role_id: request.role,
      expire: request.expire,
    }),
    responseTransformer: response => ({
      ...response,
      roles: response.roles || []
    })
  });
  public keyinfo = this.setEndpoint<{ id: string }, IKeyInfo>('get', 'keyinfo/{id}', {
    requestTransformer: request => null,
    responseTransformer: response => ({
      ...response,
      ecosystems: response.ecosystems || []
    })
  });

  // Data getters
  public getSystemParams = this.setSecuredEndpoint<ISystemParamsRequest, ISystemParamsResponse>('get', 'systemparams', {
    requestTransformer: request => ({
      names: (request.names || []).join(',')
    })
  });
  public getEcosystemName = this.setEndpoint<{ id: string | number }, string>('get', 'ecosystemname', {
    responseTransformer: response => response.ecosystem_name
  });
  public getConfig = this.setEndpoint<{ name: TConfigRequest }, string>('get', 'config/{name}', { requestTransformer: request => null });
  public getContract = this.setSecuredEndpoint<IContractRequest, IContractResponse>('get', 'contract/{name}', { requestTransformer: request => null });
  public getContracts = this.setSecuredEndpoint<ISegmentRequest, IContractsResponse>('get', 'contracts');
  public getParam = this.setSecuredEndpoint<IParamRequest, IParamResponse>('get', 'ecosystemparam/{name}', { requestTransformer: request => null });
  public getParams = this.setSecuredEndpoint<IParamsRequest, IParamsResponse>('get', 'ecosystemparams', {
    requestTransformer: request => ({
      names: (request.names || []).join(',')
    })
  });
  public getPage = this.setSecuredEndpoint<ITemplateRequest, IPageResponse>('get', 'interface/page/{name}', { requestTransformer: request => null });
  public getBlock = this.setSecuredEndpoint<ITemplateRequest, IBlockResponse>('get', 'interface/block/{name}', { requestTransformer: request => null });
  public getMenu = this.setSecuredEndpoint<ITemplateRequest, IMenuResponse>('get', 'interface/menu/{name}', { requestTransformer: request => null });
  public getTable = this.setSecuredEndpoint<ITableRequest, ITableResponse>('get', 'table/{name}', { requestTransformer: request => null });
  public getTables = this.setSecuredEndpoint<ISegmentRequest, ITablesResponse>('get', 'tables');
  public getHistory = this.setSecuredEndpoint<IHistoryRequest, IHistoryResponse>('get', 'history/{table}/{id}', { requestTransformer: () => null });
  public getRow = this.setSecuredEndpoint<IRowRequest, IRowResponse>('get', 'row/{table}/{id}', {
    requestTransformer: request => ({
      columns: (request.columns || []).join(',')
    })
  });
  public getData = this.setSecuredEndpoint<IDataRequest, IDataResponse>('get', 'list/{name}', {
    requestTransformer: request => ({
      columns: (request.columns || []).join(',')
    })
  });

  public sections = this.setSecuredEndpoint<ISectionsRequest, ISectionsResponse>('get', 'sections', {
    requestTransformer: request => ({
      lang: request.locale
    })
  });

  // Template engine
  public content = this.setSecuredEndpoint<IContentRequest, IContentResponse>('post', 'content/{type}/{name}', {
    requestTransformer: request => ({
      ...request.params,
      lang: request.locale
    }),
    responseTransformer: (response, plainText) => ({
      ...response,
      plainText
    })
  });
  public contentTest = this.setSecuredEndpoint<IContentTestRequest, IContentResponse>('post', 'content', {
    requestTransformer: request => ({
      ...request.params,
      template: request.template,
      lang: request.locale
    })
  });

  public contentJson = this.setSecuredEndpoint<IContentJsonRequest, IContentJsonResponse>('post', 'content', {
    requestTransformer: request => ({
      template: request.template,
      lang: request.locale,
      source: request.source,
    })
  });

  public contentHash = this.setEndpoint<IContentHashRequest, IContentHashResponse>('post', 'content/hash/{name}', {
    requestTransformer: request => ({
      ...request.params,
      lang: request.locale,
      ecosystem: request.ecosystem,
      keyID: request.walletID,
      roleID: request.role
    })
  });

  // Transactions
  private _txSend = this.setSecuredEndpoint<{ [key: string]: Blob }, { hashes: { [key: string]: string } }>('post', 'sendTx');
  public txSend = <T>(params: TTxCallRequest<T>) => this._txSend(params) as Promise<TTxCallResponse<T>>;

  private _txStatus = this.setSecuredEndpoint<{ hashes: string[] }, { [hash: string]: ITxStatus; }>('post', 'txstatus', {
    requestTransformer: request =>
      ({
        data: JSON.stringify({
          hashes: request.hashes
        })
      }),
    responseTransformer: response => response.results
  });
  public txStatus = <T>(params: TTxStatusRequest<T>) => this._txStatus({
    hashes: Object.keys(params).map(l => params[l])
  }) as Promise<TTxStatusResponse<T>>
}

export default IbaxAPI;
