/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export {};

// random-js captures `crypto` when its module loads, so each case loads keyring in isolation.
const loadKeyring = () => {
    let keyring: any;
    jest.isolateModules(() => {
        keyring = require('./keyring').default;
    });
    return keyring;
};

describe('keyring.generateSeed', () => {
    const originalCrypto = (global as any).crypto;

    afterEach(() => {
        jest.restoreAllMocks();
        (global as any).crypto = originalCrypto;
    });

    it('draws seed words from crypto.getRandomValues, never Math.random', () => {
        (global as any).crypto = require('crypto').webcrypto;
        const keyring = loadKeyring();
        const mathRandom = jest.spyOn(Math, 'random');
        const getRandomValues = jest.spyOn((global as any).crypto, 'getRandomValues');

        const words = keyring.generateSeed().split(' ');

        expect(words).toHaveLength(15);
        expect(mathRandom).not.toHaveBeenCalled();
        expect(getRandomValues).toHaveBeenCalled();
        expect(keyring.generateSeed()).not.toEqual(keyring.generateSeed());
    });

    it('fails closed when no secure random source exists', () => {
        (global as any).crypto = undefined;
        const keyring = loadKeyring();

        expect(() => keyring.generateSeed()).toThrow('Secure random source');
    });
});
