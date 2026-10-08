/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Token amounts. The node keeps integers in the ecosystem's smallest unit ("digits" decimals,
// reported by /balance); UTXO / TransferSelf values and contract money must be such integers > 0.
// This is the only place amounts typed by people are turned into base units.

export const AMOUNT_PROBLEMS = [
    // Not a number like "12" or "12.5"
    'format',
    // "1,5" / "1,000": a comma is ambiguous (decimal or thousands separator), so it is refused
    'separator',
    // More decimals than the token has: never rounded
    'decimals',
    'zero'
] as const;

export type TAmountProblem = typeof AMOUNT_PROBLEMS[number];

export type TAmount = { units: string } | { problem: TAmountProblem };

const BASE_UNITS = /^[1-9]\d*$/;

export const parseAmount = (input: string, digits: number): TAmount => {
    if (!Number.isInteger(digits) || digits < 0) {
        throw new RangeError(`Invalid token digits: ${digits}`);
    }
    const value = input.trim();
    if (value.includes(',')) {
        return { problem: 'separator' };
    }
    const match = /^(\d*)(?:\.(\d*))?$/.exec(value);
    if (!match || (!match[1] && !match[2])) {
        return { problem: 'format' };
    }
    const fraction = match[2] || '';
    if (fraction.length > digits) {
        return { problem: 'decimals' };
    }
    const units = BigInt((match[1] || '0') + fraction.padEnd(digits, '0'));
    return units > 0n ? { units: units.toString(10) } : { problem: 'zero' };
};

// A positive integer in base units, as the node expects it (no sign, no leading zeros)
export const isBaseUnits = (value: string) => BASE_UNITS.test(value);

// A balance in base units as the node reports it: an integer >= 0
export const isBalanceUnits = (value: string) => /^\d+$/.test(value);

// "12500" with 3 digits -> "12.5"
export const fromBaseUnits = (units: string, digits: number): string => {
    if (!/^-?\d+$/.test(units) || !Number.isInteger(digits) || digits < 0) {
        throw new RangeError(`Not an amount in base units: "${units}" (${digits} digits)`);
    }
    const negative = units.startsWith('-');
    const value = (negative ? units.slice(1) : units).replace(/^0+(?=\d)/, '');
    const padded = value.padStart(digits + 1, '0');
    const integer = padded.slice(0, padded.length - digits);
    const fraction = padded.slice(padded.length - digits).replace(/0+$/, '');
    return (negative && /[1-9]/.test(value) ? '-' : '') + integer + (fraction ? `.${fraction}` : '');
};

// For reading: "1234567.5" -> "1 234 567.5" (narrow no-break spaces). The decimal separator stays
// "." in every language, the same as amounts are typed, so "1.234" never means two things.
export const formatAmount = (units: string, digits: number): string => {
    const [integer, fraction] = fromBaseUnits(units, digits).split('.');
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    return fraction ? `${grouped}.${fraction}` : grouped;
};
