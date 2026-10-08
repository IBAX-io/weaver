/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { quarantineUnusableWallets } from './storedWallets';

const current = { id: '1', encKey: 'v1.600000.a.b.c', identities: { 'ECC_Secp256k1/KECCAK256': { publicKey: '04aa', keyID: '1' } } };
const legacy = { id: '2', encKey: 'U2FsdGVkX1+abc', publicKey: '04abc' };

describe('quarantineUnusableWallets', () => {
    it('keeps every stored wallet: unusable ones are moved, not dropped', () => {
        const damaged = { id: '3', encKey: 'v1.600000.a.b.c', identities: {} };
        const result = quarantineUnusableWallets({ storage: { locale: 'en-US', wallets: [current, legacy, damaged] } });

        expect(result.storage.wallets).toEqual([current]);
        expect(result.storage.legacyWallets).toEqual([legacy, damaged]);
        expect(result.storage.locale).toBe('en-US');
    });

    it('does not duplicate wallets already quarantined', () => {
        const once = quarantineUnusableWallets({ storage: { wallets: [legacy], legacyWallets: [legacy] } });
        expect(once.storage.legacyWallets).toEqual([legacy]);
    });

    it('leaves usable or missing wallets untouched', () => {
        expect(quarantineUnusableWallets(null)).toBeNull();
        const state = { auth: { id: '1' } };
        expect(quarantineUnusableWallets(state)).toBe(state);
        const clean = { storage: { wallets: [current] } };
        expect(quarantineUnusableWallets(clean)).toBe(clean);
    });

    it('turns damaged lists into lists, keeping what they held', () => {
        const notAList = quarantineUnusableWallets({ storage: { wallets: legacy, legacyWallets: { odd: true } } });
        expect(notAList.storage.wallets).toEqual([]);
        expect(notAList.storage.legacyWallets).toEqual([{ odd: true }, legacy]);

        const onlyLegacyDamaged = quarantineUnusableWallets({ storage: { wallets: [current], legacyWallets: 'x' } });
        expect(onlyLegacyDamaged.storage.wallets).toEqual([current]);
        expect(onlyLegacyDamaged.storage.legacyWallets).toEqual(['x']);
    });
});
