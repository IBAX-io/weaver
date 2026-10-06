/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import 'rxjs';
import 'lib/external/fsa';
import IbaxAPI, { IRequestTransport, } from 'lib/ibaxAPI';

describe('getPageTreeEpic', () => {
  it('gets page tree json', () => {

    const paramTestingAPIHost = 'http://test_Url.com';
    const paramTestingAPIEndpoint = 'api/v2';

    const paramsTransportMock: IRequestTransport = request => {
      return new Promise<any>((resolve, reject) => {
        setTimeout(() => {
          // IbaxAPI reads the parsed payload from `json` (see lib/ibaxAPI request())
          resolve({
            json: {
              __requestUrl: request.url,
              body: { 'tree': [] }
            }
          });
        }, 0);
      });
    };

    const paramTestingAPIMock = () => new IbaxAPI({
      apiHost: paramTestingAPIHost,
      apiEndpoint: paramTestingAPIEndpoint,
      transport: paramsTransportMock
    });

    const testRequest = {
      template: '',
      locale: 'en-US',
      source: true
    };

    return paramTestingAPIMock().contentJson(testRequest).then((response: any) => {
      expect(response).toEqual({
        __requestUrl: `${paramTestingAPIHost}/${paramTestingAPIEndpoint}/content`,
        body: {
          tree: []
        }
      });
    });
  });
});