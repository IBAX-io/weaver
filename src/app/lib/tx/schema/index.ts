/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from 'lib/tx/contract/field';

export interface ISchema {
    header: Uint8Array;
    fields: {
        [type: string]: new () => IField<any>;
    };
}