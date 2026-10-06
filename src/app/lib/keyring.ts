/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Account keys: BIP39 mnemonics derived like the official IBAX wallets (Ethereum HD path), and
// private keys encrypted at rest with a password. Algorithms per network live in lib/crypto.
import { generateMnemonic as bip39Generate, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { cryptoSuiteKey, DEFAULT_CRYPTO_SUITE, resolveCryptoSuite, SUPPORTED_CRYPTO_SUITES } from 'lib/crypto/suites';
import { IWallet, IWalletIdentities } from 'ibax/auth';

// Same derivation as the official IBAX wallets, so a mnemonic restores the same account
export const HD_PATH = "m/44'/60'/0'/0/0";
const MNEMONIC_STRENGTH = 128; // 12 words

// A key must be usable on every curve a network may use
export const isValidPrivateKey = (privateKey: string | null | undefined): privateKey is string => {
    if (!privateKey || !/^[0-9a-f]{64}$/i.test(privateKey)) {
        return false;
    }
    const bytes = hexToBytes(privateKey);
    return secp256k1.utils.isValidSecretKey(bytes) && p256.utils.isValidSecretKey(bytes);
};

export const generateMnemonic = () => bip39Generate(wordlist, MNEMONIC_STRENGTH);

export const normalizeMnemonic = (mnemonic: string) => mnemonic.trim().toLowerCase().split(/\s+/).join(' ');

export const isValidMnemonic = (mnemonic: string) => validateMnemonic(normalizeMnemonic(mnemonic), wordlist);

export const privateKeyFromMnemonic = (mnemonic: string) => {
    const node = HDKey.fromMasterSeed(mnemonicToSeedSync(normalizeMnemonic(mnemonic))).derive(HD_PATH);
    if (!node.privateKey) {
        throw new Error('HD derivation produced no private key');
    }
    return bytesToHex(node.privateKey);
};

// Public key and account id of the key under every supported network suite. Computed while the
// private key is at hand, so wallets can be listed for any network without the password.
export const deriveIdentities = (privateKey: string): IWalletIdentities => {
    const identities: IWalletIdentities = {};
    // The public key depends on the curve only
    const publicKeys = new Map<string, string>();
    for (const suiteId of SUPPORTED_CRYPTO_SUITES) {
        const suite = resolveCryptoSuite(suiteId);
        const publicKey = publicKeys.get(suiteId.cryptoer) ?? suite.publicKey(privateKey);
        publicKeys.set(suiteId.cryptoer, publicKey);
        identities[cryptoSuiteKey(suiteId)] = { publicKey, keyID: suite.keyID(publicKey) };
    }
    return identities;
};

// ---------------------------------------------------------------------------------------------
// Encryption at rest: PBKDF2-SHA256 + AES-GCM (WebCrypto). Format: "v1.<iterations>.<salt>.<iv>.<ciphertext>" (base64url)

const ENCRYPTION_VERSION = 'v1';
const PBKDF2_ITERATIONS = 600000;
// Accepted from stored data: fewer would weaken the key, more would make decryption hang
const MIN_ITERATIONS = 100000;
const MAX_ITERATIONS = 10000000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
// AES-GCM appends a 16 byte tag to the 32 byte key
const CIPHERTEXT_BYTES = 32 + 16;

export class InvalidEncryptedKeyError extends Error {
    constructor() {
        super('Unrecognized encrypted key format');
        this.name = 'InvalidEncryptedKeyError';
    }
}

const subtle = () => {
    const source = globalThis.crypto;
    if (!source || !source.subtle || typeof source.getRandomValues !== 'function') {
        throw new Error('WebCrypto is unavailable');
    }
    return source;
};

const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (value: string) => {
    if (!/^[A-Za-z0-9_-]*$/.test(value)) {
        throw new InvalidEncryptedKeyError();
    }
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    try {
        return Uint8Array.from(atob(base64 + '='.repeat((4 - base64.length % 4) % 4)), c => c.charCodeAt(0));
    }
    catch {
        throw new InvalidEncryptedKeyError();
    }
};

const deriveAesKey = async (password: string, salt: Uint8Array, iterations: number) => {
    const webcrypto = subtle();
    const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return webcrypto.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-256', salt: salt as Uint8Array<ArrayBuffer>, iterations },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

export const encryptPrivateKey = async (privateKey: string, password: string) => {
    const webcrypto = subtle();
    const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = webcrypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveAesKey(password, salt, PBKDF2_ITERATIONS);
    const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, hexToBytes(privateKey)));
    return [ENCRYPTION_VERSION, PBKDF2_ITERATIONS, toBase64Url(salt), toBase64Url(iv), toBase64Url(ciphertext)].join('.');
};

// Resolves with the private key, or null when the password is wrong (AES-GCM authentication
// fails); throws InvalidEncryptedKeyError for anything that is not a key this module encrypted
export const decryptPrivateKey = async (encKey: string, password: string): Promise<string | null> => {
    const parts = (encKey || '').split('.');
    if (parts.length !== 5 || parts[0] !== ENCRYPTION_VERSION || !/^\d{1,9}$/.test(parts[1])) {
        throw new InvalidEncryptedKeyError();
    }
    const iterations = Number(parts[1]);
    const [salt, iv, ciphertext] = parts.slice(2).map(fromBase64Url);
    if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS || salt.length !== SALT_BYTES || iv.length !== IV_BYTES || ciphertext.length !== CIPHERTEXT_BYTES) {
        throw new InvalidEncryptedKeyError();
    }
    const key = await deriveAesKey(password, salt, iterations);
    try {
        const plain = await subtle().subtle.decrypt({ name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> }, key, ciphertext as Uint8Array<ArrayBuffer>);
        const privateKey = bytesToHex(new Uint8Array(plain));
        return isValidPrivateKey(privateKey) ? privateKey : null;
    }
    catch (e) {
        return null;
    }
};

// A stored wallet; its id is the account id under the default network suite, so importing the
// same key twice yields the same wallet
export const createWallet = async (privateKey: string, password: string): Promise<IWallet> => {
    const identities = deriveIdentities(privateKey);
    return {
        id: identities[cryptoSuiteKey(DEFAULT_CRYPTO_SUITE)].keyID,
        encKey: await encryptPrivateKey(privateKey, password),
        identities
    };
};
