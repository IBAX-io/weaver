/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { dropUnusableWallets } from './storedWallets';

describe('dropUnusableWallets', () => {
    it('keeps current wallets and drops wallets of the old format', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const current = { id: '1', encKey: 'v1.600000.a.b.c', identities: {} };
        const legacy = { id: '2', encKey: 'U2FsdGVkX1+abc', publicKey: '04abc' };

        const result = dropUnusableWallets({ storage: { locale: 'en-US', wallets: [current, legacy] } });

        expect(result.storage.wallets).toEqual([current]);
        expect(result.storage.locale).toBe('en-US');
        expect(warn).toHaveBeenCalledOnce();
    });

    it('leaves state without wallets untouched', () => {
        expect(dropUnusableWallets(null)).toBeNull();
        const state = { auth: { id: '1' } };
        expect(dropUnusableWallets(state)).toBe(state);
    });
});
