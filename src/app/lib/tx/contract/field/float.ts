/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField, { InvalidFieldValueError } from './';

const DECIMAL = /^\s*[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?\s*$/i;

// Sent as float64 (the transaction is encoded with forceIntegerToFloat): the node refuses a float
// parameter that arrives as a msgpack integer, which a value like 5 would otherwise become
class Float implements IField<string | number, number> {
    private _value = 0;

    set(value: string | number) {
        const parsed = 'number' === typeof value ? value : 'string' === typeof value && DECIMAL.test(value) ? parseFloat(value) : NaN;
        if (!Number.isFinite(parsed)) {
            throw new InvalidFieldValueError(value);
        }
        this._value = parsed;
    }

    get() {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Float;
