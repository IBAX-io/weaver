/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as yup from 'yup';
import { INetwork } from 'ibax/auth';
import { isHttpsUrl } from './httpsUrl';

const webConfig = yup.object().shape({
  defaultLocale: yup.string().notRequired(),
  defaultNetwork: yup.string().notRequired(),
  networks: yup.array().of(yup.object({
    key: yup.string().required(),
    name: yup.string().required(),
    networkID: yup.number().required(),
    honorNodes: yup.array().of(yup.string()).required().min(1),
    socketUrl: yup.string().notRequired(),
    activationEmail: yup.string().email().notRequired(),
    enableDemoMode: yup.bool(),
    disableSync: yup.bool(),
    // The block explorer API: https only, it is called from the wallet page. One that is not is left
    // out (the network then has none: the wallet page says so), not the whole settings refused.
    explorer: yup.string().notRequired().transform(value => {
      if (undefined === value || null === value || isHttpsUrl(value)) {
        return value;
      }
      console.warn(`settings.json: explorer ${JSON.stringify(value)} is not an https address; the network is used without one`);
      return undefined;
    }),

  })).test('ValidationError', params => `${params.path}[x].key must be unique`, function (value: { key: string }[] | undefined) {
    if (!value) {
      return true;
    }
    const unique = value.filter((element, index, self) => {
      return self.findIndex(subElement => subElement.key === element.key) === index;
    });
    return unique.length === value.length;
  })
});

// A network of the settings, as the app stores it
export const networkFromSettings = (network: yup.InferType<typeof webConfig>['networks'][number]): INetwork => ({
  uuid: network.key,
  id: network.networkID,
  name: network.name,
  honorNodes: network.honorNodes,
  socketUrl: network.socketUrl,
  activationEmail: network.activationEmail,
  disableSync: network.disableSync,
  demoEnabled: network.enableDemoMode,
  explorer: network.explorer
});

export default webConfig;