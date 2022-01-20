/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISchema } from './';
import Boolean from '../contract/field/boolean';
import Integer from '../contract/field/integer';
import Float from '../contract/field/float';
import Money from '../contract/field/money';
import String from '../contract/field/string';
import File from '../contract/field/file';
import StringCollection from '../contract/field/stringCollection';

const defaultSchema: ISchema = {
    header: new Uint8Array([0x80]),
    fields: {
        'bool': Boolean,
        'int': Integer,
        'float': Float,
        'money': Money,
        'string': String,
        'file': File,
        'array': StringCollection,
    }
};

export default defaultSchema;