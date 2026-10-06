/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { decryptLegacyPrivateKey, isLegacyWallet } from './legacyWallet';
import fixture from './fixtures/cryptojs-legacy-wallets.json';

describe('legacy wallets', () => {
    it('decrypts keys stored by both crypto-js versions Weaver shipped', async () => {
        expect(new Set(fixture.vectors.map(v => v.lib))).toEqual(new Set(['crypto-js@3', 'crypto-js@4']));
        for (const v of fixture.vectors) {
            const wallet = { id: '1', encKey: v.encKey, publicKey: v.publicKey };
            expect(await decryptLegacyPrivateKey(wallet, v.password)).toBe(v.privateKey);
            // Without the stored public key the key is still recovered
            expect(await decryptLegacyPrivateKey({ id: '1', encKey: v.encKey }, v.password)).toBe(v.privateKey);
        }
    });

    it('refuses a wrong password', async () => {
        for (const v of fixture.vectors) {
            expect(await decryptLegacyPrivateKey({ id: '1', encKey: v.encKey, publicKey: v.publicKey }, v.password + 'x')).toBeNull();
        }
    });

    it('refuses a key that does not match the stored public key', async () => {
        const a = fixture.vectors[0];
        const b = fixture.vectors.find(v => v.privateKey !== a.privateKey);
        expect(a.privateKey).not.toBe(b.privateKey);
        expect(await decryptLegacyPrivateKey({ id: '1', encKey: a.encKey, publicKey: b.publicKey }, a.password)).toBeNull();
    });

    it('recognises the old stored format only', () => {
        expect(isLegacyWallet({ id: '1', encKey: fixture.vectors[0].encKey, publicKey: '04ab' })).toBe(true);
        expect(isLegacyWallet({ id: '1', encKey: 'v1.600000.a.b.c', identities: {} })).toBe(false);
        expect(isLegacyWallet({ id: 1, encKey: fixture.vectors[0].encKey })).toBe(false);
        expect(isLegacyWallet(null)).toBe(false);
    });

    it('refuses data that is not a legacy key', async () => {
        for (const encKey of ['', 'U2FsdGVkX1', 'not base64!', btoa('Salted__12345678short')]) {
            expect(await decryptLegacyPrivateKey({ id: '1', encKey }, 'pw')).toBeNull();
        }
    });
});
