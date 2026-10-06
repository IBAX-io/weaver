/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';

const loadKeyring = async () => {
    vi.resetModules();
    return (await import('./keyring')).default;
};

describe('keyring.generateSeed', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('draws seed words from crypto.getRandomValues, never Math.random', async () => {
        vi.stubGlobal('crypto', webcrypto);
        const keyring = await loadKeyring();
        const mathRandom = vi.spyOn(Math, 'random');
        const getRandomValues = vi.spyOn(webcrypto, 'getRandomValues');

        const words = keyring.generateSeed().split(' ');

        expect(words).toHaveLength(15);
        expect(mathRandom).not.toHaveBeenCalled();
        expect(getRandomValues).toHaveBeenCalled();
        expect(keyring.generateSeed()).not.toEqual(keyring.generateSeed());
    });

    it('fails closed when no secure random source exists', async () => {
        vi.stubGlobal('crypto', undefined);
        const keyring = await loadKeyring();

        expect(() => keyring.generateSeed()).toThrow('Secure random source');
    });
});
