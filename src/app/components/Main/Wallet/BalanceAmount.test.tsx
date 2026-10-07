/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { formatAmount } from 'lib/tx/amount';
import BalanceAmount from './BalanceAmount';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = async (amount: string, symbol: string) => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => root.render(<BalanceAmount amount={amount} symbol={symbol} />));
    const amountElement = container.querySelector<HTMLElement>('.wallet__amount');
    const result = {
        // The pieces that never break inside, and where a line may break between them
        parts: [...amountElement.childNodes].map(node => (node as HTMLElement).tagName === 'WBR' ? '<wbr>' : node.textContent),
        chars: amountElement.style.getPropertyValue('--wallet-amount-chars')
    };
    await act(() => root.unmount());
    return result;
};

describe('BalanceAmount', () => {
    it('may break a long balance only at its decimal point, the token kept with the last digits', async () => {
        const amount = formatAmount('1000000000123456789012', 12);
        expect(amount).toBe('1\u202F000\u202F000\u202F000.123456789012');
        expect(await render(amount, 'IBXC')).toEqual({
            parts: ['1\u202F000\u202F000\u202F000', '<wbr>', '.123456789012\u00A0IBXC'],
            // Sizes the font to the whole number and its token
            chars: String(amount.length + 1 + 'IBXC'.length)
        });
    });

    it('does not break a whole number at all', async () => {
        expect((await render(formatAmount('5000', 0), 'ABC')).parts).toEqual(['5\u202F000\u00A0ABC']);
    });
});
