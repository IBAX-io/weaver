/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';
import { Int64BE } from 'int64-buffer';

class Integer implements IField<Int64BE | string | number, Int64BE> {
    private _value: Int64BE = new Int64BE();

    set(value: Int64BE | string | number) {
        if (!value) {
            this._value = new Int64BE();
        }
        else if ('string' === typeof value) {
            this._value = new Int64BE(value);
        }
        else if ('number' === typeof value) {
            this._value = new Int64BE(value);
        }
        else {
            this._value = value;
        }
    }

    get(): Int64BE {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Integer;