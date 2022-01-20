/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as yup from 'yup';

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

  })).test('ValidationError', params => `${params.path}[x].key must be unique`, function (value: any[]) {
    const unique = value.filter((element, index, self) => {
      return self.findIndex(subElement => subElement.key === element.key) === index;
    });
    return unique.length === value.length;
  })
});

export default webConfig;