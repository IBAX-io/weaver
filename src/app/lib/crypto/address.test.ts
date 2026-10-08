/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { formatAddress, parseAddress } from './address';
import fixture from './fixtures/go-ibax-addresses.json';

describe('parseAddress', () => {
    it('accepts exactly what the node accepts', () => {
        for (const c of fixture.cases) {
            // AddressToID returns 0 for invalid input; 0 itself is no account, so it is rejected too
            expect([c.input, parseAddress(c.input)]).toEqual([c.input, c.id === '0' ? null : c.id]);
        }
    });

    it('covers both outcomes (control)', () => {
        expect(fixture.cases.some(c => c.id !== '0')).toBe(true);
        expect(fixture.cases.some(c => c.id === '0')).toBe(true);
    });

    it('round-trips with formatAddress', () => {
        for (const c of fixture.cases.filter(item => item.id !== '0')) {
            expect(formatAddress(c.id)).toBe(c.address);
            expect(parseAddress(formatAddress(c.id))).toBe(c.id);
        }
    });

    it('rejects a mistyped digit', () => {
        expect(parseAddress('0624-2890-6001-1238-3609')).not.toBeNull();
        expect(parseAddress('0624-2890-6001-1238-3608')).toBeNull();
    });
});
