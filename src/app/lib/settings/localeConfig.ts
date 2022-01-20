/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as yup from 'yup';

const localeConfig = yup.object().shape({
    locales: yup.array().of(yup.object({
        key: yup.string().required(),
        name: yup.string().required(),
        enabled: yup.bool()

    })).test('ValidationError', params => `${params.path}[x].key must be unique`, function (value: any[]) {
        const unique = value.filter((element, index, self) => {
            return self.findIndex(subElement => subElement.key === element.key) === index;
        });
        return unique.length === value.length;
    })
});

export default localeConfig;