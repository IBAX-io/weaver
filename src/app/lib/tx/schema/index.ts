/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from 'lib/tx/contract/field';

// Converters from form values to the types a contract parameter expects
export interface ISchema {
    fields: {
        [type: string]: new () => IField<any>;
    };
}