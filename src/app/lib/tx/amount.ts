/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Token amounts: the node stores integers in the ecosystem's smallest unit ("digits" decimals,
// reported by /balance) and UTXO / TransferSelf values must match ^\d+$ and be > 0.

// "12.5" with 3 digits -> "12500"; null for anything that is not a positive amount the
// ecosystem can represent (more decimals than digits are refused, never rounded)
export const toBaseUnits = (amount: string, digits: number): string | null => {
    const match = /^(\d*)(?:[.,](\d*))?$/.exec(amount.trim());
    if (!match || (!match[1] && !match[2]) || !Number.isInteger(digits) || digits < 0) {
        return null;
    }
    const fraction = match[2] || '';
    if (fraction.length > digits) {
        return null;
    }
    const units = BigInt((match[1] || '0') + fraction.padEnd(digits, '0'));
    return units > 0n ? units.toString(10) : null;
};

// "12500" with 3 digits -> "12.5"
export const fromBaseUnits = (units: string, digits: number): string => {
    const negative = units.startsWith('-');
    const value = (negative ? units.slice(1) : units).replace(/^0+(?=\d)/, '');
    const padded = value.padStart(digits + 1, '0');
    const integer = padded.slice(0, padded.length - digits);
    const fraction = padded.slice(padded.length - digits).replace(/0+$/, '');
    return (negative ? '-' : '') + integer + (fraction ? `.${fraction}` : '');
};
