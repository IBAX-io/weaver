/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { hexToBytes } from '@noble/hashes/utils.js';
import { ICryptoSuiteId, resolveCryptoSuite, UnsupportedCryptoSuiteError } from './suites';
import { formatAddress } from './address';
import fixture from './fixtures/go-ibax-vectors.json';

// Vectors come from the node's own Go crypto package, so these tests pin the client to the
// exact keys, account ids and signatures the node computes and accepts.
const vectors = fixture.vectors.map(v => ({ ...v, suite: { cryptoer: v.cryptoer, hasher: v.hasher } as ICryptoSuiteId }));
const label = (v: typeof vectors[number]) => `${v.cryptoer}/${v.hasher} ${v.privateKey.slice(0, 6)}`;

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
        // when r or s has leading zero bytes (8 to 72 bytes)
        if ('SM2' === v.cryptoer) {
            expect(txSignature).toMatch(/^30[0-9a-f]{2}02/);
            expect(parseInt(txSignature.slice(2, 4), 16)).toBe(txSignature.length / 2 - 2);
            expect(txSignature.length / 2).toBeLessThanOrEqual(72);
        }
        else {
            expect(txSignature).toHaveLength(128);
        }
    });

    it('implements every suite go-ibax implements, and refuses the one it only names', () => {
        const names = new Set(vectors.map(v => `${v.cryptoer}/${v.hasher}`));
        for (const cryptoer of ['ECC_Secp256k1', 'ECC_P256', 'SM2']) {
            for (const hasher of ['SHA256', 'KECCAK256', 'SHA3_256', 'SM3']) {
                expect(names.has(`${cryptoer}/${hasher}`)).toBe(true);
            }
        }
        // go-ibax's NewAsymAlgo panics for ECC_P512: no node can run with it
        expect(() => resolveCryptoSuite({ cryptoer: 'ECC_P512', hasher: 'SHA256' })).toThrow(UnsupportedCryptoSuiteError);
    });

    it('formats account ids like the node', () => {
        expect(formatAddress('6242890600112383609')).toBe('0624-2890-6001-1238-3609');
        expect(formatAddress('-1')).toBe('1844-6744-0737-0955-1615');
    });
});
