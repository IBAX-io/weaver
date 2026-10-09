/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { p256 } from '@noble/curves/nist.js';
import { ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { sha256, sha384 } from '@noble/hashes/sha2.js';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { Pkcs11Client, Pkcs11Error } from './client';
import { createSoftHsmTokens, softHsmAvailable, softHsmModule, USER_PIN } from './softhsm';

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const bytes = (value: string) => new Uint8Array(Buffer.from(value, 'hex'));

const codeOf = (fn: () => unknown) => {
    try {
        fn();
    }
    catch (e) {
        return e instanceof Pkcs11Error ? e.code : (e as Error).message;
    }
    return null;
};

describe.skipIf(!softHsmAvailable())('Pkcs11Client against SoftHSM', () => {
    let cleanup: () => void;
    let client: Pkcs11Client;
    let serial: string;
    let other: string;

    beforeAll(() => {
        cleanup = createSoftHsmTokens(['weaver-a', 'weaver-b']);
        client = Pkcs11Client.load(softHsmModule());
        const tokens = client.tokens();
        serial = tokens.find(token => 'weaver-a' === token.label).serial;
        other = tokens.find(token => 'weaver-b' === token.label).serial;
    });

    afterAll(() => {
        client?.close();
        cleanup?.();
    });

    it('describes the module and its tokens', () => {
        expect(client.info.manufacturer).toContain('SoftHSM');
        const token = client.tokens().find(token => token.serial === serial);
        expect(token).toMatchObject({ label: 'weaver-a', loggedIn: false, protectedAuthPath: false, pinLocked: false });
        expect(token.cryptoers).toContain('ECC_P256');
        expect(token.hashers).toEqual(['SHA256', 'SHA384', 'SHA512', 'SHA3_256']);
    });

    it('needs a login before keys are used', () => {
        expect(codeOf(() => client.keys(serial))).toBe('E_PKCS11_NOT_LOGGED_IN');
        expect(codeOf(() => client.generateKey(serial, 'ECC_P256', 'k'))).toBe('E_PKCS11_NOT_LOGGED_IN');
    });

    it('rejects a wrong PIN and an unknown token', () => {
        expect(codeOf(() => client.login(serial, '00000000'))).toBe('E_PKCS11_PIN_INCORRECT');
        expect(codeOf(() => client.login('no-such-token', USER_PIN))).toBe('E_PKCS11_TOKEN_ABSENT');
    });

    it('generates a P-256 key and signs with it as the node checks', () => {
        client.login(serial, USER_PIN);
        client.login(serial, USER_PIN);
        expect(client.tokens().find(token => token.serial === serial).loggedIn).toBe(true);

        const key = client.generateKey(serial, 'ECC_P256', 'p256 key');
        expect(key).toMatchObject({ label: 'p256 key', cryptoer: 'ECC_P256' });
        expect(key.publicKey).toMatch(/^04[0-9a-f]{128}$/);
        expect(key.id).toMatch(/^[0-9a-f]{32}$/);
        expect(client.keys(serial)).toContainEqual(key);

        const data = utf8ToBytes('LOGIN1234');
        for (const [hasher, hash] of [['SHA256', sha256], ['SHA3_256', sha3_256], ['SHA384', sha384]] as const) {
            const signature = client.sign({ token: serial, keyId: key.id, cryptoer: 'ECC_P256', hasher, data: hex(data) });
            expect(signature).toHaveLength(128);
            expect(p256.verify(bytes(signature), hash(data), bytes(key.publicKey), { prehash: false, lowS: false })).toBe(true);
        }
    });

    it('keeps tokens apart', () => {
        const [key] = client.keys(serial);
        client.login(other, USER_PIN);
        expect(client.keys(other)).toEqual([]);
        expect(codeOf(() => client.sign({ token: other, keyId: key.id, cryptoer: 'ECC_P256', hasher: 'SHA256', data: '00' }))).toBe('E_PKCS11_KEY_NOT_FOUND');
        expect(codeOf(() => client.sign({ token: serial, keyId: key.id, cryptoer: 'MLDSA65', hasher: 'SHA256', data: '00' }))).toBe('E_PKCS11_KEY_NOT_FOUND');
    });

    it('generates ML-DSA keys and signs with the IBAX context', ({ skip }) => {
        if (!client.tokens().find(token => token.serial === serial).cryptoers.includes('MLDSA65')) {
            skip();
        }
        const data = utf8ToBytes('payload');
        for (const [cryptoer, level, size, context] of [['MLDSA65', ml_dsa65, 1952, 'IBAX-MLDSA-65-v1'], ['MLDSA87', ml_dsa87, 2592, 'IBAX-MLDSA-87-v1']] as const) {
            const key = client.generateKey(serial, cryptoer, cryptoer);
            expect(key.cryptoer).toBe(cryptoer);
            expect(bytes(key.publicKey)).toHaveLength(size);
            const signature = client.sign({ token: serial, keyId: key.id, cryptoer, hasher: 'SHA384', data: hex(data) });
            expect(level.verify(bytes(signature), sha384(data), bytes(key.publicKey), { context: utf8ToBytes(context) })).toBe(true);
        }
        expect(client.keys(serial).map(key => key.cryptoer).sort()).toEqual(['ECC_P256', 'MLDSA65', 'MLDSA87']);
    });

    it('forgets the login on logout', () => {
        client.logout(serial);
        client.logout(serial);
        expect(client.tokens().find(token => token.serial === serial).loggedIn).toBe(false);
        expect(codeOf(() => client.keys(serial))).toBe('E_PKCS11_NOT_LOGGED_IN');
    });
});

describe('Pkcs11Client.load', () => {
    it('reports a missing module', () => {
        expect(codeOf(() => Pkcs11Client.load('/no/such/module.so'))).toBe('E_PKCS11_NO_MODULE');
    });
});
