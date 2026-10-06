/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField, { InvalidFieldValueError } from './';
import { parseAmount } from 'lib/tx/amount';

// Money parameters are typed in coins of ecosystem 1 (12 decimals) and sent as a whole number of
// base units >= 1, the only values the node accepts (go-ibax smart.FillTxData, DtMoney)
const MONEY_DIGITS = 12;

class Money implements IField<string | number, string> {
    private _value = '';

    set(value: string | number) {
        const amount = parseAmount(String(value), MONEY_DIGITS);
        if (!('units' in amount)) {
            throw new InvalidFieldValueError(value);
        }
        this._value = amount.units;
    }

    get() {
        return this._value;
    }

    toString() {
        return this._value;
    }
}

export default Money;
