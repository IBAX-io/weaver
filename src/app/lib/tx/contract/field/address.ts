/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField, { InvalidFieldValueError } from './';
import { parseAddress } from 'lib/crypto/address';

// An account: typed as "XXXX-XXXX-XXXX-XXXX-XXXX" or an id, sent as the int64 account id
class Address implements IField<string | bigint, bigint> {
    private _value = 0n;

    set(value: string | bigint) {
        const id = 'string' === typeof value || 'bigint' === typeof value ? parseAddress(value.toString()) : null;
        if (null === id) {
            throw new InvalidFieldValueError(value);
        }
        this._value = BigInt(id);
    }

    get() {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Address;
