/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as yup from 'yup';
import { ILocale } from 'ibax';

const localeConfig = yup.object().shape({
    locales: yup.array().of(yup.object({
        key: yup.string().required(),
        name: yup.string().required(),
        // A locale without the flag is not offered (as before: a missing flag was falsy)
        enabled: yup.bool().required().default(false)
    }).required()).required().test('ValidationError', params => `${params.path}[x].key must be unique`, function (value: { key: string }[] | undefined) {
    if (!value) {
      return true;
    }
        const unique = value.filter((element, index, self) => {
            return self.findIndex(subElement => subElement.key === element.key) === index;
        });
        return unique.length === value.length;
    })
});

// yup infers every field as optional without strictNullChecks; the schema requires them
export const validateLocaleConfig = (value: unknown) => localeConfig.validate(value) as Promise<{ locales: ILocale[] }>;

export default localeConfig;