/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField, { InvalidFieldValueError } from './';

const INT64_MIN = -(1n << 63n);
const INT64_MAX = (1n << 63n) - 1n;

// Contract integers are int64 on the node; bigint keeps the full range and encodes as int64
class Integer implements IField<bigint | string | number, bigint> {
    private _value = 0n;

    set(value: bigint | string | number) {
        let parsed: bigint;
        if ('bigint' === typeof value) {
            parsed = value;
        }
        else if ('number' === typeof value && Number.isSafeInteger(value)) {
            parsed = BigInt(value);
        }
        else if ('string' === typeof value && /^\s*-?\d+\s*$/.test(value)) {
            parsed = BigInt(value.trim());
        }
        else {
            throw new InvalidFieldValueError(value);
        }
        if (parsed < INT64_MIN || parsed > INT64_MAX) {
            throw new InvalidFieldValueError(value);
        }
        this._value = parsed;
    }

    get(): bigint {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Integer;
