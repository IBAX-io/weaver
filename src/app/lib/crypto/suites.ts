/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Key, hash and signature algorithms of an IBAX network. Every node reports its suite in
// /getuid (cryptoer + hasher); the client must use exactly that suite for keys, account ids and
// signatures. Mirrors go-ibax packages/common/crypto: Sign(priv, data) = ECDSA(Hash(data)).
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256, sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { ICryptoSuiteId, TCryptoer, THasher } from 'ibax/crypto';
import { keyIDFromDigest } from './address';

export type { ICryptoSuiteId, TCryptoer, THasher };

export interface ICryptoSuite {
    readonly id: ICryptoSuiteId;
    // Uncompressed public key, hex with the 04 prefix (the node accepts it and cuts the prefix)
    publicKey(privateKeyHex: string): string;
    // Signed int64 account id, decimal
    keyID(publicKeyHex: string): string;
    hash(data: Uint8Array): Uint8Array;
    doubleHash(data: Uint8Array): Uint8Array;
    // ECDSA over hash(data), r||s hex; data is a UTF-8 string or raw bytes
    sign(data: string | Uint8Array, privateKeyHex: string): string;
    verify(data: string | Uint8Array, signatureHex: string, publicKeyHex: string): boolean;
}

export class UnsupportedCryptoSuiteError extends Error {
    readonly suite: ICryptoSuiteId;

    constructor(suite: ICryptoSuiteId) {
        super(`Unsupported crypto suite ${suite.cryptoer}/${suite.hasher}`);
        this.name = 'UnsupportedCryptoSuiteError';
        this.suite = suite;
    }
}

// The suite every public IBAX network uses (mainnet and testnet report it in /getuid)
export const DEFAULT_CRYPTO_SUITE: ICryptoSuiteId = { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' };

type TCurve = typeof secp256k1 | typeof p256;

const CURVES: { [cryptoer: string]: TCurve } = {
    ECC_Secp256k1: secp256k1,
    ECC_P256: p256
};

const HASHES: { [hasher: string]: (data: Uint8Array) => Uint8Array } = {
    SHA256: data => sha256(data),
    KECCAK256: data => keccak_256(data),
    SHA3_256: data => sha3_256(data)
};

const toBytes = (data: string | Uint8Array) => 'string' === typeof data ? utf8ToBytes(data) : data;
const stripPrefix = (publicKeyHex: string) => publicKeyHex.length === 130 && publicKeyHex.startsWith('04') ? publicKeyHex.slice(2) : publicKeyHex;

// Nodes report their suite in /getuid. Nodes that predate configurable crypto do not report one;
// they used ECDSA P-256 with SHA-256, which is what the client always used with them.
export const LEGACY_CRYPTO_SUITE: ICryptoSuiteId = { cryptoer: 'ECC_P256', hasher: 'SHA256' };

export const cryptoSuiteFromNode = (cryptoer: string | undefined, hasher: string | undefined): ICryptoSuiteId =>
    cryptoer && hasher
        ? { cryptoer: cryptoer as TCryptoer, hasher: hasher as THasher }
        : LEGACY_CRYPTO_SUITE;

export const SUPPORTED_CRYPTO_SUITES: ICryptoSuiteId[] = Object.keys(CURVES)
    .flatMap(cryptoer => Object.keys(HASHES).map(hasher => ({ cryptoer, hasher } as ICryptoSuiteId)));

export const cryptoSuiteKey = (suite: ICryptoSuiteId) => `${suite.cryptoer}/${suite.hasher}`;

export const resolveCryptoSuite = (suite: ICryptoSuiteId): ICryptoSuite => {
    const curve = CURVES[suite.cryptoer];
    const hash = HASHES[suite.hasher];
    if (!curve || !hash) {
        throw new UnsupportedCryptoSuiteError(suite);
    }

    return {
        id: suite,
        publicKey: privateKeyHex => bytesToHex(curve.getPublicKey(hexToBytes(privateKeyHex), false)),
        keyID: publicKeyHex => keyIDFromDigest(hash(hexToBytes(stripPrefix(publicKeyHex)))),
        hash,
        doubleHash: data => hash(hash(data)),
        sign: (data, privateKeyHex) => bytesToHex(curve.sign(hash(toBytes(data)), hexToBytes(privateKeyHex), { prehash: false, lowS: true })),
        verify: (data, signatureHex, publicKeyHex) => {
            const publicKey = hexToBytes(publicKeyHex.length === 128 ? '04' + publicKeyHex : publicKeyHex);
            return curve.verify(hexToBytes(signatureHex), hash(toBytes(data)), publicKey, { prehash: false, lowS: false });
        }
    };
};
