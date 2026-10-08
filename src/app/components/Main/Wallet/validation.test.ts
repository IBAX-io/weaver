/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { checkAmount, checkRecipient } from './validation';

describe('wallet input checks', () => {
    it('accepts amounts within the balance', () => {
        expect(checkAmount('1.5', 12, '1500000000000')).toEqual({ units: '1500000000000' });
        expect(checkAmount(' 0.001 ', 3, '1')).toEqual({ units: '1' });
    });

    it('says what is wrong with an amount', () => {
        expect(checkAmount('', 12, '10')).toEqual({ problem: 'required' });
        expect(checkAmount('1,5', 12, '10')).toEqual({ problem: 'separator' });
        expect(checkAmount('-1', 12, '10')).toEqual({ problem: 'format' });
        expect(checkAmount('0', 12, '10')).toEqual({ problem: 'zero' });
        expect(checkAmount('0.0001', 3, '10')).toEqual({ problem: 'decimals' });
        expect(checkAmount('1.5', 12, '1499999999999')).toEqual({ problem: 'exceeds' });
        expect(checkAmount('1', 0, '0')).toEqual({ problem: 'exceeds' });
    });

    it('leaves room for the fee when it is paid from the same balance', () => {
        expect(checkAmount('1.5', 12, '1500000000000', true)).toEqual({ problem: 'feeReserve' });
        expect(checkAmount('1.4', 12, '1500000000000', true)).toEqual({ units: '1400000000000' });
        expect(checkAmount('1.5', 12, '1500000000000', false)).toEqual({ units: '1500000000000' });
    });

    it('treats a balance it cannot read as empty', () => {
        expect(checkAmount('1', 0, 'abc')).toEqual({ problem: 'exceeds' });
    });

    it('accepts only valid recipients', () => {
        expect(checkRecipient('0059-7920-1508-6419-2934')).toEqual({ toID: '597920150864192934' });
        expect(checkRecipient('0059-7920-1508-6419-2935')).toEqual({ problem: 'invalid' });
        expect(checkRecipient('  ')).toEqual({ problem: 'required' });
    });
});
