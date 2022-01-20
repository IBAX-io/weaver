// MIT License
// 
// Copyright (c) 2020 IBAX
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import keyring from 'lib/keyring';

const MOCK_PASSWORD = '12345678';
const MOCK_PUBLIC_KEY = '042e3077c513f3e2b7eaaeafb6ac299db932316e3b89fdcdde2eb0b524754b7a6893f5e11dfdba96ac47bf57e53e5fe46b958843cf54037b647b5abd7fa4403b97';
const MOCK_ENCRYPTED_KEY = 'U2FsdGVkX19bpEaxxr9ZVpY05Iikcm1vgZsLWHNTv1dlUzqPpq9uKSOlc9z5PGMsKi12io/x7LFvAnXQSvOPCeWLTqKZGofMoZJGHqTUQ16gr2d1i/ZWuEUo0KGNWoBL';

test('AES encrypt/decrypt sequence(valid)', () => {
    const MOCK_DATA = 'Test case scenratio';
    const encrypted = keyring.encryptAES(MOCK_DATA, MOCK_PASSWORD);
    const decrypted = keyring.decryptAES(encrypted, MOCK_PASSWORD);
    expect(MOCK_DATA === decrypted).toBeTruthy();
});

test('AES encrypt/decrypt sequence(invalid)', () => {
    const MOCK_DATA = 'Test case scenratio';
    const encrypted = keyring.encryptAES(MOCK_DATA, MOCK_PASSWORD);
    const decrypted = keyring.decryptAES(encrypted, MOCK_PASSWORD + '1');
    expect(MOCK_DATA === decrypted).toBeFalsy();
});

test('Keyring keypair generation using short(l < 64) seed', () => {
    const keyPair1 = keyring.generateKeyPair('hello');
    const keyPair2 = keyring.generateKeyPair('hello');
    expect(keyPair1.public === keyPair2.public).toBeTruthy();
    expect(keyPair1.private === keyPair2.private).toBeTruthy();
});

test('Keyring keypair generation using long(l > 64) seed', () => {
    const seed = keyring.generateSeed();
    const keyPair1 = keyring.generateKeyPair(seed);
    const keyPair2 = keyring.generateKeyPair(seed);
    expect(keyPair1.public === keyPair2.public).toBeTruthy();
    expect(keyPair1.private === keyPair2.private).toBeTruthy();
});

test('Keyring keypair generation using two different seeds', () => {
    const seed1 = keyring.generateSeed();
    const seed2 = keyring.generateSeed();
    const keyPair1 = keyring.generateKeyPair(seed1);
    const keyPair2 = keyring.generateKeyPair(seed2);
    expect(keyPair1.public === keyPair2.public).toBeFalsy();
    expect(keyPair1.private === keyPair2.private).toBeFalsy();
});

test('Keyring verification', () => {
    const key = keyring.decryptAES(MOCK_ENCRYPTED_KEY, MOCK_PASSWORD);
    const result = keyring.verify(key, MOCK_PUBLIC_KEY, 'test case #1');
    expect(result).toBe(true);
});

test('Complex encrypt/decrypt scenario', () => {
    const seed = keyring.generateSeed();
    const keyPair = keyring.generateKeyPair(seed);
    const encKey = keyring.encryptAES(keyPair.private, MOCK_PASSWORD);
    const decKey = keyring.decryptAES(encKey, MOCK_PASSWORD);
    const result = keyring.verify(decKey, keyPair.public, 'Test case scenario');
    expect(result).toBeTruthy();
});

test('Key backup scenario', () => {
    const key = {
        id: '-1465863158328511897',
        privateKey: '06076ac7d0bdaea988cfaee2af78b790805e41e38aa52c773cb37eb76adf91e0',
        publicKey: '04ea0cdb0f9b2a8d7fa7403fe302c3f4686e0e52ef3d5d473df3d2c477c53bf9d76efc67d93b2b1d7042df219edda66c6c04d51e089e026bbf69e40ecedf1dd556',
        address: '1698-0880-9153-8103-9719',
        ecosystems: { '1': 'Test', '2': 'Hello', '3': 'World' }
    };

    const backup = keyring.backup(key);
    const restored = keyring.restore(backup);
    expect(restored).toEqual({
        privateKey: '06076ac7d0bdaea988cfaee2af78b790805e41e38aa52c773cb37eb76adf91e0',
        ecosystems: { '1': null, '2': null, '3': null }
    });
});

test('Private to public key generation', () => {
    const privateKey = keyring.decryptAES(MOCK_ENCRYPTED_KEY, MOCK_PASSWORD);
    const publicKey = keyring.genereatePublicKey(privateKey);
    expect(publicKey).toEqual(MOCK_PUBLIC_KEY);
});