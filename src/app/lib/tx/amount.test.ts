/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { formatAmount, fromBaseUnits, isBalanceUnits, isBaseUnits, parseAmount } from './amount';

const units = (input: string, digits: number) => {
    const amount = parseAmount(input, digits);
    return 'units' in amount ? amount.units : null;
};

describe('amounts', () => {
    it('converts to base units without rounding', () => {
        expect(units('1.5', 12)).toBe('1500000000000');
        expect(units('.5', 1)).toBe('5');
        expect(units('7', 0)).toBe('7');
        expect(units(' 2.000 ', 3)).toBe('2000');
        expect(units('007', 2)).toBe('700');
        expect(units('99999999999999999999', 12)).toBe('99999999999999999999000000000000');
    });

    it('says why an amount is refused', () => {
        expect(parseAmount('1,000', 3)).toEqual({ problem: 'separator' });
        expect(parseAmount('0,25', 2)).toEqual({ problem: 'separator' });
        expect(parseAmount('1.0001', 3)).toEqual({ problem: 'decimals' });
        expect(parseAmount('1.5', 0)).toEqual({ problem: 'decimals' });
        expect(parseAmount('0', 3)).toEqual({ problem: 'zero' });
        expect(parseAmount('0.000', 3)).toEqual({ problem: 'zero' });
        for (const value of ['', '.', '-1', '+1', '1e3', '1.2.3', 'abc', '１', '1 000']) {
            expect([value, parseAmount(value, 3)]).toEqual([value, { problem: 'format' }]);
        }
        expect(() => parseAmount('1', -1)).toThrow(RangeError);
    });

    it('knows what the node accepts as base units', () => {
        expect(isBalanceUnits('0')).toBe(true);
        expect(isBalanceUnits('-1')).toBe(false);
        expect(isBaseUnits('1')).toBe(true);
        expect(isBaseUnits('1500000000000')).toBe(true);
        for (const value of ['0', '0001', '-1', '1.5', '', ' 1']) {
            expect([value, isBaseUnits(value)]).toEqual([value, false]);
        }
    });

    it('formats base units for display', () => {
        expect(fromBaseUnits('1500000000000', 12)).toBe('1.5');
        expect(fromBaseUnits('0', 12)).toBe('0');
        expect(fromBaseUnits('5', 3)).toBe('0.005');
        expect(fromBaseUnits('007000', 3)).toBe('7');
        expect(fromBaseUnits('-25', 2)).toBe('-0.25');
        expect(fromBaseUnits('-0', 2)).toBe('0');
        expect(fromBaseUnits('12', 0)).toBe('12');
        for (const value of ['1', '1500000000000', '123456789012345678901234567890']) {
            expect(units(fromBaseUnits(value, 12), 12)).toBe(value);
        }
    });

    it('refuses to format what is not an amount', () => {
        for (const value of ['abc', '1.5', ' 12', '-', '']) {
            expect(() => fromBaseUnits(value, 12)).toThrow(RangeError);
        }
        expect(() => fromBaseUnits('1', -1)).toThrow(RangeError);
    });

    it('groups thousands for reading, keeping the dot as decimal separator', () => {
        expect(formatAmount('1234567500000000000', 12)).toBe('1\u202F234\u202F567.5');
        expect(formatAmount('999', 0)).toBe('999');
        expect(formatAmount('-1000', 0)).toBe('-1\u202F000');
        expect(formatAmount('5', 3)).toBe('0.005');
    });
});
