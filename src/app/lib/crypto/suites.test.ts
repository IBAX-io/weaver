/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { bytesToNumberBE } from '@noble/curves/utils.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { cryptoSuiteFromNode, ICryptoSuiteId, isSupportedCryptoSuite, resolveCryptoSuite, SUPPORTED_CRYPTO_SUITES, UnsupportedCryptoSuiteError } from './suites';
import { formatAddress } from './address';
import fixture from './fixtures/go-ibax-vectors.json';

// Vectors come from the node's own Go crypto package, so these tests pin the client to the
// exact keys, account ids and signatures the node computes and accepts.
const vectors = fixture.vectors.map(v => ({ ...v, suite: { cryptoer: v.cryptoer, hasher: v.hasher } as ICryptoSuiteId }));
const label = (v: typeof vectors[number]) => `${v.cryptoer}/${v.hasher} ${v.privateKey.slice(0, 6)}`;

// The ML-DSA levels with their signature lengths (FIPS 204 table 2)
const MLDSA_LEVELS: { [cryptoer: string]: { level: typeof ml_dsa65 | typeof ml_dsa87, signatureSize: number } } = {
    MLDSA65: { level: ml_dsa65, signatureSize: 3309 },
    MLDSA87: { level: ml_dsa87, signatureSize: 4627 }
};

describe('crypto suites vs go-ibax', () => {
    it.each(vectors.map(v => [label(v), v] as const))('%s: public key and account id', (_, v) => {
        const suite = resolveCryptoSuite(v.suite);
        expect(suite.publicKey(v.privateKey)).toBe(v.publicKey);
        expect(suite.keyID(v.publicKey)).toBe(v.keyID);
    });

    it.each(vectors.filter(v => v.goSignature).map(v => [label(v), v] as const))('%s: accepts the node\'s signature', (_, v) => {
        const suite = resolveCryptoSuite(v.suite);
        expect(suite.verify(v.message, v.goSignature, v.publicKey)).toBe(true);
        expect(suite.verify(v.message + 'x', v.goSignature, v.publicKey)).toBe(false);
    });

    it.each(vectors.map(v => [label(v), v] as const))('%s: own signatures round-trip and depend on the hasher', (_, v) => {
        const suite = resolveCryptoSuite(v.suite);
        const payload = hexToBytes(v.payload);
        const txSignature = suite.sign(suite.doubleHash(payload), v.privateKey);
        expect(suite.verify(suite.doubleHash(payload), txSignature, v.publicKey)).toBe(true);
        expect(suite.verify(suite.doubleHash(payload.slice(1)), txSignature, v.publicKey)).toBe(false);
        // ECDSA: r || s; SM2: DER, as gmsm writes it: SEQUENCE of two INTEGERs, minimal, so shorter
        // when r or s has leading zero bytes (8 to 72 bytes); ML-DSA: fixed per level
        if ('SM2' === v.cryptoer) {
            expect(txSignature).toMatch(/^30[0-9a-f]{2}02/);
            expect(parseInt(txSignature.slice(2, 4), 16)).toBe(txSignature.length / 2 - 2);
            expect(txSignature.length / 2).toBeLessThanOrEqual(72);
        }
        else if (MLDSA_LEVELS[v.cryptoer]) {
            expect(txSignature).toHaveLength(2 * MLDSA_LEVELS[v.cryptoer].signatureSize);
        }
        else {
            expect(txSignature).toHaveLength(128);
        }
    });

    it('implements every suite go-ibax implements, and refuses the one it only names', () => {
        const names = new Set(vectors.map(v => `${v.cryptoer}/${v.hasher}`));
        for (const cryptoer of ['ECC_Secp256k1', 'ECC_P256', 'SM2', 'MLDSA65', 'MLDSA87']) {
            for (const hasher of ['SHA256', 'KECCAK256', 'SHA3_256', 'SM3', 'SHA384', 'SHA512']) {
                expect(names.has(`${cryptoer}/${hasher}`)).toBe(true);
            }
        }
        expect(SUPPORTED_CRYPTO_SUITES).toHaveLength(30);
        expect(names.size).toBe(30);
        // go-ibax's NewAsymAlgo panics for ECC_P512: no node can run with it
        expect(() => resolveCryptoSuite({ cryptoer: 'ECC_P512', hasher: 'SHA256' })).toThrow(UnsupportedCryptoSuiteError);
    });

    it('formats account ids like the node', () => {
        expect(formatAddress('6242890600112383609')).toBe('0624-2890-6001-1238-3609');
        expect(formatAddress('-1')).toBe('1844-6744-0737-0955-1615');
    });

    it('never signs one key and digest with the same nonce on two curves', () => {
        // The nonce k of an ECDSA signature, from the key (r || s, up to the sign low s picks)
        const nonces = (n: bigint, digest: Uint8Array, privateKey: string, signatureHex: string) => {
            const sig = hexToBytes(signatureHex);
            const [r, s] = [bytesToNumberBE(sig.slice(0, 32)), bytesToNumberBE(sig.slice(32))];
            const k = (secp256k1.Point.Fn.ORDER === n ? secp256k1.Point.Fn : p256.Point.Fn);
            const value = k.mul(k.inv(k.create(s)), k.create(bytesToNumberBE(digest) + r * bytesToNumberBE(hexToBytes(privateKey))));
            return [value, n - value];
        };
        // A node can ask for both: it reports P-256, then secp256k1, and the same login challenge
        const challenge = 'LOGIN58551740666882655616';
        for (const { privateKey } of vectors.slice(0, 3)) {
            for (const hasher of ['KECCAK256', 'SHA256'] as const) {
                const k1 = resolveCryptoSuite({ cryptoer: 'ECC_Secp256k1', hasher });
                const k2 = resolveCryptoSuite({ cryptoer: 'ECC_P256', hasher });
                const digest = k1.hash(new TextEncoder().encode(challenge));
                const a = nonces(secp256k1.Point.Fn.ORDER, digest, privateKey, k1.sign(challenge, privateKey));
                const b = nonces(p256.Point.Fn.ORDER, digest, privateKey, k2.sign(challenge, privateKey));
                expect(a.some(value => b.includes(value))).toBe(false);
                // Nor twice the same on one curve
                expect(k1.sign(challenge, privateKey)).not.toBe(k1.sign(challenge, privateKey));
            }
        }
    });

    it.each(vectors.filter(v => v.contextFreeSignature).map(v => [label(v), v] as const))('%s: refuses the node\'s signature made without the context', (_, v) => {
        const suite = resolveCryptoSuite(v.suite);
        // A valid ML-DSA signature of the same digest, only under the empty context
        expect(MLDSA_LEVELS[v.cryptoer].level.verify(hexToBytes(v.contextFreeSignature), suite.hash(utf8ToBytes(v.message)), hexToBytes(v.publicKey))).toBe(true);
        expect(suite.verify(v.message, v.contextFreeSignature, v.publicKey)).toBe(false);
    });

    it('has a context-free signature for every ML-DSA vector', () => {
        const mldsa = vectors.filter(v => v.cryptoer.startsWith('MLDSA'));
        expect(mldsa.length).toBeGreaterThan(0);
        expect(mldsa.filter(v => !v.contextFreeSignature)).toEqual([]);
    });

    it.each(Object.keys(MLDSA_LEVELS))('signs %s hedged and only under the IBAX context', cryptoer => {
        const v = vectors.find(item => cryptoer === item.cryptoer);
        const { level } = MLDSA_LEVELS[cryptoer];
        const suite = resolveCryptoSuite(v.suite);
        const digest = suite.doubleHash(hexToBytes(v.payload));
        expect(suite.sign(digest, v.privateKey)).not.toBe(suite.sign(digest, v.privateKey));
        // The same key and digest signed without the context, as for any other application
        const { secretKey } = level.keygen(hexToBytes(v.privateKey));
        const foreign = bytesToHex(level.sign(suite.hash(digest), secretKey));
        expect(suite.verify(digest, foreign, v.publicKey)).toBe(false);
        // Nor under the other level's context
        const otherContext = utf8ToBytes('MLDSA65' === cryptoer ? 'IBAX-MLDSA-87-v1' : 'IBAX-MLDSA-65-v1');
        const otherLevel = bytesToHex(level.sign(suite.hash(digest), secretKey, { context: otherContext }));
        expect(suite.verify(digest, otherLevel, v.publicKey)).toBe(false);
        expect(suite.verify(digest, suite.sign(digest, v.privateKey), v.publicKey)).toBe(true);
        expect(suite.canUsePrivateKey('00'.repeat(32))).toBe(true);
    });

    it('takes a suite from the node: none reported is the legacy one, half of one is none', () => {
        expect(cryptoSuiteFromNode(undefined, undefined)).toEqual({ cryptoer: 'ECC_P256', hasher: 'SHA256' });
        expect(cryptoSuiteFromNode('', '')).toEqual({ cryptoer: 'ECC_P256', hasher: 'SHA256' });
        for (const half of [cryptoSuiteFromNode('', 'SM3'), cryptoSuiteFromNode('SM2', undefined)]) {
            expect(isSupportedCryptoSuite(half)).toBe(false);
        }
        // Names of the lookup tables' prototype are no algorithms
        for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
            expect(isSupportedCryptoSuite({ cryptoer: name, hasher: 'SHA256' } as ICryptoSuiteId)).toBe(false);
            expect(() => resolveCryptoSuite({ cryptoer: 'SM2', hasher: name } as ICryptoSuiteId)).toThrow(UnsupportedCryptoSuiteError);
        }
    });

    it('verifies a public key given without its 04 prefix, and refuses what is no hex', () => {
        const v = vectors.find(item => item.goSignature && 'SM2' === item.cryptoer);
        const suite = resolveCryptoSuite(v.suite);
        expect(suite.verify(v.message, v.goSignature, v.publicKey.slice(2))).toBe(true);
        expect(suite.verify(v.message, 'zz', v.publicKey)).toBe(false);
    });
});
