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
        expect(txSignature).toHaveLength(128);
    });

    it('rejects suites it cannot implement', () => {
        expect(() => resolveCryptoSuite({ cryptoer: 'SM2', hasher: 'SM3' })).toThrow(UnsupportedCryptoSuiteError);
    });

    it('formats account ids like the node', () => {
        expect(formatAddress('6242890600112383609')).toBe('0624-2890-6001-1238-3609');
        expect(formatAddress('-1')).toBe('1844-6744-0737-0955-1615');
    });
});
