/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Key, hash and signature algorithms of an IBAX network. Every node reports its suite in
// /getuid (cryptoer + hasher); the client must use exactly that suite for keys, account ids and
// signatures. Mirrors go-ibax packages/common/crypto: Sign(priv, data) = Cryptoer.Sign(Hash(data)),
// for every cryptoer and hasher go-ibax implements (ECC_P512 it names but does not implement).
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256 } from '@noble/curves/nist.js';
import { ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa.js';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { keccak_256, sha3_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, concatBytes, hexToBytes, randomBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { ICryptoSuiteId, TCryptoer, THasher } from 'ibax/crypto';
import { keyIDFromDigest } from './address';
import { isValidSm2PrivateKey, sm2PublicKey, sm2Sign, sm2Verify, sm3 } from './sm';

export type { ICryptoSuiteId, TCryptoer, THasher };

export interface ICryptoSuite {
    readonly id: ICryptoSuiteId;
    // Whether the private key lies in the curve's range (SM2's is the smallest of the three)
    canUsePrivateKey(privateKeyHex: string): boolean;
    // Public key, hex: for the curves uncompressed with the 04 prefix (the node accepts it and cuts
    // the prefix), for ML-DSA its 1952-byte (ML-DSA-65) or 2592-byte (ML-DSA-87) encoding
    publicKey(privateKeyHex: string): string;
    // Signed int64 account id, decimal
    keyID(publicKeyHex: string): string;
    hash(data: Uint8Array): Uint8Array;
    doubleHash(data: Uint8Array): Uint8Array;
    // Signature over hash(data), hex: ECDSA r||s, SM2 DER, or ML-DSA's 3309 (ML-DSA-65) or 4627
    // (ML-DSA-87) bytes; data is a UTF-8 string or raw bytes
    sign(data: string | Uint8Array, privateKeyHex: string): string;
    verify(data: string | Uint8Array, signatureHex: string, publicKeyHex: string): boolean;
}

// A key outside the range of the network's curve: the account has no address on that network
export class KeyNotUsableError extends Error {
    readonly suite: ICryptoSuiteId;

    constructor(suite: ICryptoSuiteId) {
        super(`The key cannot be used with ${suite.cryptoer}`);
        this.name = 'KeyNotUsableError';
        this.suite = suite;
    }
}

export class UnsupportedCryptoSuiteError extends Error {
    readonly suite: ICryptoSuiteId;

    constructor(suite: ICryptoSuiteId) {
        super(`Unsupported crypto suite ${suite.cryptoer}/${suite.hasher}`);
        this.name = 'UnsupportedCryptoSuiteError';
        this.suite = suite;
    }
}

// The suite every public IBAX network uses (mainnet and testnet report it in /getuid). Only a
// default for the client itself: the identity a wallet is listed under (keyring id) and the
// accounts the sign-in page shows before any network was reached. It never decides how anything
// is signed: that is always the suite the node reports (cryptoSuiteFromNode), kept in the session.
export const DEFAULT_CRYPTO_SUITE: ICryptoSuiteId = { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' };

// A cryptoer: the public key of a private key, and signatures over a digest as the node makes and
// checks them
interface ISigner {
    canUse(privateKey: Uint8Array): boolean;
    publicKey(privateKey: Uint8Array): Uint8Array;
    sign(digest: Uint8Array, privateKey: Uint8Array): Uint8Array;
    verify(digest: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
}

// Signatures are hedged (RFC 6979 section 3.6): the nonce comes from the key, the digest, fresh
// random bytes and the curve's name. Plain RFC 6979 gives the same nonce on secp256k1 and P-256
// for the same key and digest, and two such signatures give the key away (a node can ask for both
// by reporting one suite, then the other); a weak random source still cannot leak the key alone.
const ecdsa = (curve: typeof secp256k1 | typeof p256, name: string): ISigner => ({
    canUse: privateKey => curve.utils.isValidSecretKey(privateKey),
    publicKey: privateKey => curve.getPublicKey(privateKey, false),
    // r || s, low s; the node accepts any s
    sign: (digest, privateKey) => curve.sign(digest, privateKey, {
        prehash: false,
        lowS: true,
        extraEntropy: concatBytes(randomBytes(32), utf8ToBytes(name))
    }),
    verify: (digest, signature, publicKey) => {
        try {
            return curve.verify(signature, digest, publicKey, { prehash: false, lowS: false });
        }
        catch (e) {
            return false;
        }
    }
});

// ML-DSA (FIPS 204), as go-ibax asymalgo.MLDSA65 and MLDSA87: the 32-byte private key is the seed
// the key pair is expanded from, so every wallet key is usable. Pure ML-DSA over the digest with the
// level's IBAX context string, hedged (fresh randomness in every signature).
const mldsa = (level: typeof ml_dsa65 | typeof ml_dsa87, context: string): ISigner => {
    const options = { context: utf8ToBytes(context) };
    return {
        canUse: privateKey => privateKey.length === 32,
        publicKey: privateKey => level.keygen(privateKey).publicKey,
        sign: (digest, privateKey) => level.sign(digest, level.keygen(privateKey).secretKey, options),
        verify: (digest, signature, publicKey) => {
            try {
                return level.verify(signature, digest, publicKey, options);
            }
            catch (e) {
                return false;
            }
        }
    };
};

const SIGNERS: { [cryptoer: string]: ISigner } = {
    ECC_Secp256k1: ecdsa(secp256k1, 'ECC_Secp256k1'),
    ECC_P256: ecdsa(p256, 'ECC_P256'),
    SM2: { canUse: isValidSm2PrivateKey, publicKey: sm2PublicKey, sign: sm2Sign, verify: sm2Verify },
    MLDSA65: mldsa(ml_dsa65, 'IBAX-MLDSA-65-v1'),
    MLDSA87: mldsa(ml_dsa87, 'IBAX-MLDSA-87-v1')
};

const HASHES: { [hasher: string]: (data: Uint8Array) => Uint8Array } = {
    SHA256: data => sha256(data),
    KECCAK256: data => keccak_256(data),
    SHA3_256: data => sha3_256(data),
    SM3: data => sm3(data),
    SHA384: data => sha384(data),
    SHA512: data => sha512(data)
};

const toBytes = (data: string | Uint8Array) => 'string' === typeof data ? utf8ToBytes(data) : data;
const stripPrefix = (publicKeyHex: string) => publicKeyHex.length === 130 && publicKeyHex.startsWith('04') ? publicKeyHex.slice(2) : publicKeyHex;

// Nodes report their suite in /getuid. Nodes that predate configurable crypto do not report one;
// they used ECDSA P-256 with SHA-256, which is what the client always used with them.
export const LEGACY_CRYPTO_SUITE: ICryptoSuiteId = { cryptoer: 'ECC_P256', hasher: 'SHA256' };

// A node reporting one of the two names is not one of those: its suite is unknown, which no
// supported suite matches (signing then fails as unsupported instead of with the wrong algorithm)
export const cryptoSuiteFromNode = (cryptoer: string | undefined, hasher: string | undefined): ICryptoSuiteId =>
    !cryptoer && !hasher
        ? LEGACY_CRYPTO_SUITE
        : { cryptoer: (cryptoer || '') as TCryptoer, hasher: (hasher || '') as THasher };

export const SUPPORTED_CRYPTO_SUITES: ICryptoSuiteId[] = Object.keys(SIGNERS)
    .flatMap(cryptoer => Object.keys(HASHES).map(hasher => ({ cryptoer, hasher } as ICryptoSuiteId)));

export const cryptoSuiteKey = (suite: ICryptoSuiteId) => `${suite.cryptoer}/${suite.hasher}`;

export const sameCryptoSuite = (a: ICryptoSuiteId, b: ICryptoSuiteId) => cryptoSuiteKey(a) === cryptoSuiteKey(b);

// The names come from the node: only the tables' own entries count (not "constructor" and the like)
export const isSupportedCryptoSuite = (suite: ICryptoSuiteId) =>
    Object.hasOwn(SIGNERS, suite.cryptoer) && Object.hasOwn(HASHES, suite.hasher);

export const resolveCryptoSuite = (suite: ICryptoSuiteId): ICryptoSuite => {
    if (!isSupportedCryptoSuite(suite)) {
        throw new UnsupportedCryptoSuiteError(suite);
    }
    const signer = SIGNERS[suite.cryptoer];
    const hash = HASHES[suite.hasher];

    return {
        id: suite,
        canUsePrivateKey: privateKeyHex => signer.canUse(hexToBytes(privateKeyHex)),
        publicKey: privateKeyHex => bytesToHex(signer.publicKey(hexToBytes(privateKeyHex))),
        keyID: publicKeyHex => keyIDFromDigest(hash(hexToBytes(stripPrefix(publicKeyHex)))),
        hash,
        doubleHash: data => hash(hash(data)),
        sign: (data, privateKeyHex) => bytesToHex(signer.sign(hash(toBytes(data)), hexToBytes(privateKeyHex))),
        verify: (data, signatureHex, publicKeyHex) => {
            let signature: Uint8Array;
            let publicKey: Uint8Array;
            try {
                signature = hexToBytes(signatureHex);
                publicKey = hexToBytes(publicKeyHex.length === 128 ? '04' + publicKeyHex : publicKeyHex);
            }
            catch (e) {
                return false;
            }
            return signer.verify(hash(toBytes(data)), signature, publicKey);
        }
    };
};
