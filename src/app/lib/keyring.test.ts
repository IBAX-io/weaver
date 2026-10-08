/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import {
    createWallet,
    decryptPrivateKey,
    deriveIdentities,
    encryptPrivateKey,
    generateMnemonic,
    InvalidEncryptedKeyError,
    isValidMnemonic,
    isValidPrivateKey,
    privateKeyFromMnemonic
} from './keyring';
import { cryptoSuiteKey, DEFAULT_CRYPTO_SUITE, SUPPORTED_CRYPTO_SUITES } from 'lib/crypto/suites';
import fixture from 'lib/crypto/fixtures/go-ibax-vectors.json';

// BIP39 test mnemonic; its first Ethereum account (m/44'/60'/0'/0/0) is a well-known vector
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const TEST_MNEMONIC_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';

describe('keyring', () => {
    it('generates valid 12-word mnemonics from a secure random source', () => {
        const first = generateMnemonic();
        expect(first.split(' ')).toHaveLength(12);
        expect(isValidMnemonic(first)).toBe(true);
        expect(generateMnemonic()).not.toEqual(first);
    });

    it('derives keys like the official IBAX / Ethereum wallets', () => {
        expect(privateKeyFromMnemonic(TEST_MNEMONIC)).toBe(TEST_MNEMONIC_KEY);
        expect(privateKeyFromMnemonic(`  ${TEST_MNEMONIC.toUpperCase()}  `)).toBe(TEST_MNEMONIC_KEY);
    });

    it('validates mnemonics and private keys', () => {
        expect(isValidMnemonic(TEST_MNEMONIC.replace(/about$/, 'abandon'))).toBe(false);
        expect(isValidPrivateKey(TEST_MNEMONIC_KEY)).toBe(true);
        expect(isValidPrivateKey('0'.repeat(64))).toBe(false);
        expect(isValidPrivateKey('f'.repeat(64))).toBe(false);
        expect(isValidPrivateKey('a'.repeat(63))).toBe(false);
        expect(isValidPrivateKey('zz' + TEST_MNEMONIC_KEY.slice(2))).toBe(false);
        expect(isValidPrivateKey(undefined)).toBe(false);
    });

    it('takes a key past SM2\'s range, with no address on SM2 networks and one on every other', () => {
        // SM2's group order: valid on secp256k1 and P-256 (larger orders), not on SM2
        const key = 'fffffffeffffffffffffffffffffffff7203df6b21c6052b53bbf40939d54123';
        expect(isValidPrivateKey(key)).toBe(true);
        const identities = deriveIdentities(key);
        const keys = Object.keys(identities);
        expect(keys).toHaveLength(12);
        for (const suite of keys) {
            if (suite.startsWith('SM2/')) {
                expect(identities[suite]).toBeNull();
            }
            else {
                expect(identities[suite]).toEqual(expect.objectContaining({ keyID: expect.any(String) }));
            }
        }
        // One step inside the range: an address on SM2 networks too
        expect(deriveIdentities('fffffffeffffffffffffffffffffffff7203df6b21c6052b53bbf40939d54121')['SM2/SM3']).not.toBeNull();
    });

    it('derives the same identities as the node for every suite', () => {
        const vector = fixture.vectors[0];
        const identities = deriveIdentities(vector.privateKey);
        for (const v of fixture.vectors.filter(item => item.privateKey === vector.privateKey)) {
            expect(identities[`${v.cryptoer}/${v.hasher}`]).toEqual({ publicKey: v.publicKey, keyID: v.keyID });
        }
    });

    it('encrypts keys so that only the right password decrypts them', async () => {
        const encKey = await encryptPrivateKey(TEST_MNEMONIC_KEY, 'correct horse');

        expect(encKey).toMatch(/^v1\.600000\./);
        expect(encKey).not.toContain(TEST_MNEMONIC_KEY);
        expect(await decryptPrivateKey(encKey, 'correct horse')).toBe(TEST_MNEMONIC_KEY);
        expect(await decryptPrivateKey(encKey, 'wrong horse')).toBeNull();
        expect(await encryptPrivateKey(TEST_MNEMONIC_KEY, 'correct horse')).not.toEqual(encKey);
    }, 20000);

    it('rejects data that is not an encrypted key', async () => {
        await expect(decryptPrivateKey('U2FsdGVkX1+legacyCryptoJS', 'pw')).rejects.toThrow(InvalidEncryptedKeyError);
    });

    it('refuses work factors and fields a stored key cannot have', async () => {
        const [version, , salt, iv, ciphertext] = (await encryptPrivateKey(TEST_MNEMONIC_KEY, 'pw')).split('.');
        for (const encKey of [
            // A tampered work factor would make unlocking trivial or hang the app
            [version, 99999, salt, iv, ciphertext],
            [version, 10000001, salt, iv, ciphertext],
            [version, 600000, salt + '*', iv, ciphertext],
            [version, 600000, salt, iv.slice(2), ciphertext],
            [version, 600000, salt, iv, ciphertext + 'AA']
        ]) {
            await expect(decryptPrivateKey(encKey.join('.'), 'pw')).rejects.toThrow(InvalidEncryptedKeyError);
        }
    }, 20000);

    it('stores wallets under their default-suite account id', async () => {
        const wallet = await createWallet(TEST_MNEMONIC_KEY, 'pw');
        expect(wallet.id).toBe(wallet.identities[cryptoSuiteKey(DEFAULT_CRYPTO_SUITE)].keyID);
        // One for every suite a network can use, SM2 and SM3 included
        expect(Object.keys(wallet.identities).sort()).toEqual(SUPPORTED_CRYPTO_SUITES.map(cryptoSuiteKey).sort());
        expect(Object.keys(wallet.identities)).toContain('SM2/SM3');
    }, 20000);
});
