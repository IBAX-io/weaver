/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// What signs for the user: a wallet's private key in memory, or a key that stays in a PKCS#11
// module. Either signs as go-ibax checks it: Cryptoer.Sign(Hash(data)) with the network's suite.
// A network in FIPS 140-3 mode takes signatures from a validated module only: there, a key in
// memory signs nothing.
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { IModuleKeyRef } from 'ibax/auth';
import { IPkcs11, TModuleHasher, TSignerErrorCode } from 'ibax/pkcs11';
import { isPkcs11Error } from 'lib/pkcs11';
import { ICryptoSuiteId, resolveCryptoSuite, sameCryptoSuite, UnsupportedCryptoSuiteError } from './suites';

export type TSigningKey =
    { kind: 'software', privateKey: string } |
    { kind: 'module', key: IModuleKeyRef };

export interface ISigner {
    readonly suite: ICryptoSuiteId;
    // Hex, as the node takes it in a login and a transaction header
    readonly publicKey: string;
    readonly keyID: string;
    // Signature over hash(data), hex
    sign(data: string | Uint8Array): Promise<string>;
}

export interface ISignerOptions {
    // The network runs in FIPS 140-3 mode (/getuid fips)
    fips: boolean;
    // The desktop app's module access; null in the browser
    pkcs11: IPkcs11 | null;
}

export const E_FIPS_SIGNER_REQUIRED = 'E_FIPS_SIGNER_REQUIRED';
export const E_PKCS11_UNAVAILABLE = 'E_PKCS11_UNAVAILABLE';

// A FIPS network and a key in memory: nothing is signed
export class FipsSignerRequiredError extends Error {
    readonly code = E_FIPS_SIGNER_REQUIRED;

    constructor() {
        super('The network runs in FIPS mode: only a key in a PKCS#11 module signs for it');
        this.name = 'FipsSignerRequiredError';
    }
}

// A module key where no module can be reached (the web app)
export class Pkcs11UnavailableError extends Error {
    readonly code = E_PKCS11_UNAVAILABLE;

    constructor() {
        super('PKCS#11 modules are available in the desktop app only');
        this.name = 'Pkcs11UnavailableError';
    }
}

// Why nothing was signed, where the signer (not the node) refused: each has an auth.error.* and a
// tx.error.* message in every locale
export const SIGNER_ERRORS = [
    E_FIPS_SIGNER_REQUIRED, E_PKCS11_UNAVAILABLE,
    'E_PKCS11_NO_MODULE', 'E_PKCS11_TOKEN_ABSENT', 'E_PKCS11_PIN_INCORRECT', 'E_PKCS11_PIN_LOCKED',
    'E_PKCS11_PIN_EXPIRED', 'E_PKCS11_NOT_LOGGED_IN', 'E_PKCS11_KEY_NOT_FOUND', 'E_PKCS11_UNSUPPORTED',
    'E_PKCS11_CANCELLED', 'E_PKCS11_INVALID_ARGUMENT', 'E_PKCS11_MODULE'
] as const satisfies readonly TSignerErrorCode[];

// The signer's code for an error, null for one the signer did not raise
export const signerErrorCode = (error: unknown): TSignerErrorCode | null => {
    if (error instanceof FipsSignerRequiredError || error instanceof Pkcs11UnavailableError) {
        return error.code;
    }
    return isPkcs11Error(error) ? error.code : null;
};

const MODULE_HASHERS: string[] = ['SHA256', 'SHA384', 'SHA512', 'SHA3_256'] satisfies TModuleHasher[];

export const softwareKey = (privateKey: string): TSigningKey => ({ kind: 'software', privateKey });
export const moduleKey = (key: IModuleKeyRef): TSigningKey => ({ kind: 'module', key });

// Whether a module key can sign for the suite: its own cryptoer, with a hash the module computes
export const moduleKeyServes = (key: IModuleKeyRef, suite: ICryptoSuiteId) =>
    key.cryptoer === suite.cryptoer && MODULE_HASHERS.includes(suite.hasher);

const toBytes = (data: string | Uint8Array) => 'string' === typeof data ? utf8ToBytes(data) : data;

export const createSigner = (key: TSigningKey, suite: ICryptoSuiteId, options: ISignerOptions): ISigner => {
    const crypto = resolveCryptoSuite(suite);
    if ('software' === key.kind) {
        if (options.fips) {
            throw new FipsSignerRequiredError();
        }
        const publicKey = crypto.publicKey(key.privateKey);
        return {
            suite,
            publicKey,
            keyID: crypto.keyID(publicKey),
            sign: async data => crypto.sign(data, key.privateKey)
        };
    }

    if (!moduleKeyServes(key.key, suite)) {
        throw new UnsupportedCryptoSuiteError(suite);
    }
    const pkcs11 = options.pkcs11;
    if (!pkcs11) {
        throw new Pkcs11UnavailableError();
    }
    const { token, id, cryptoer, publicKey } = key.key;
    return {
        suite,
        publicKey,
        keyID: crypto.keyID(publicKey),
        // The module hashes with the suite's hasher and signs the digest
        sign: data => pkcs11.sign({
            token: token.serial,
            keyId: id,
            cryptoer,
            hasher: suite.hasher as TModuleHasher,
            data: bytesToHex(toBytes(data))
        })
    };
};

// What decides how a session signs: the network's suite, and whether it runs in FIPS mode. A
// session restored from before the client knew of FIPS mode signed in software: not FIPS.
export interface INodeCrypto {
    cryptoSuite: ICryptoSuiteId;
    fips?: boolean;
}

export const sameNodeCrypto = (a: INodeCrypto, b: INodeCrypto) =>
    sameCryptoSuite(a.cryptoSuite, b.cryptoSuite) && !!a.fips === !!b.fips;
