/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';

// Contract integers are int64 on the node; bigint keeps the full range and encodes as int64
class Integer implements IField<bigint | string | number, bigint> {
    private _value = 0n;

    set(value: bigint | string | number) {
        if ('bigint' === typeof value) {
            this._value = BigInt.asIntN(64, value);
        }
        else if ('number' === typeof value) {
            this._value = Number.isFinite(value) ? BigInt.asIntN(64, BigInt(Math.trunc(value))) : 0n;
        }
        else if ('string' === typeof value && /^\s*-?\d+\s*$/.test(value)) {
            this._value = BigInt.asIntN(64, BigInt(value.trim()));
        }
        else {
            this._value = 0n;
        }
    }

    get(): bigint {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Integer;
