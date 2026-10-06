/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { toBaseUnits } from 'lib/tx/amount';
import { parseAddress } from 'lib/crypto/address';

export type TAmountCheck =
    { units: string } |
    { problem: 'required' | 'format' | 'decimals' | 'exceeds' };

// An amount the user typed, against the balance it is paid from (both in base units)
export const checkAmount = (input: string, digits: number, available: string): TAmountCheck => {
    const value = input.trim();
    if (!value) {
        return { problem: 'required' };
    }
    const match = /^(\d*)(?:[.,](\d*))?$/.exec(value);
    if (!match || (!match[1] && !match[2])) {
        return { problem: 'format' };
    }
    if ((match[2] || '').length > digits) {
        return { problem: 'decimals' };
    }
    const units = toBaseUnits(value, digits);
    if (units === null) {
        return { problem: 'format' };
    }
    if (BigInt(units) > BigInt(available)) {
        return { problem: 'exceeds' };
    }
    return { units };
};

export type TRecipientCheck =
    { toID: string } |
    { problem: 'required' | 'invalid' };

export const checkRecipient = (input: string): TRecipientCheck => {
    if (!input.trim()) {
        return { problem: 'required' };
    }
    const toID = parseAddress(input);
    return toID === null ? { problem: 'invalid' } : { toID };
};
