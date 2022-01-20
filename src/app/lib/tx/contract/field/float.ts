/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';

class Float implements IField<string | number, number> {
    private _value: number;

    set(value: string | number) {
        if ('number' === typeof value) {
            this._value = value === value ? value : 0;
        }
        else if ('string' === typeof value) {
            const val = parseFloat(value);
            this._value = val === val ? val : 0;
        }
        else {
            this._value = 0;
        }
    }

    get() {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Float;