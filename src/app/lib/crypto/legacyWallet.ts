/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Wallets stored by Weaver up to 1.4: { id, encKey, publicKey }, where encKey is
// crypto-js AES.encrypt(privateKeyHex, password) in passphrase mode, i.e. OpenSSL's format:
// "Salted__" + 8 byte salt + AES-256-CBC ciphertext, key and IV from EVP_BytesToKey(MD5, 1 round).
// The key is a secp256r1 key. Only decryption is needed: the key is then stored like any new one.
import { md5 } from '@noble/hashes/legacy.js';
import { bytesToHex, concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { p256 } from '@noble/curves/nist.js';
import { hexToBytes } from '@noble/hashes/utils.js';

export interface ILegacyWallet {
    id: string;
    encKey: string;
    publicKey?: string;
}

const SALTED = utf8ToBytes('Salted__');

export const isLegacyWallet = (value: unknown): value is ILegacyWallet => {
    const wallet = value as ILegacyWallet;
    return !!wallet && 'object' === typeof wallet
        && 'string' === typeof wallet.id
        && 'string' === typeof wallet.encKey && wallet.encKey.startsWith('U2FsdGVkX1')
        && (undefined === wallet.publicKey || 'string' === typeof wallet.publicKey);
};

// OpenSSL EVP_BytesToKey with MD5 and one round: D_i = MD5(D_{i-1} || password || salt)
const evpBytesToKey = (password: Uint8Array, salt: Uint8Array, length: number) => {
    let derived = new Uint8Array(0);
    let block = new Uint8Array(0);
    while (derived.length < length) {
        block = md5(concatBytes(block, password, salt));
        derived = concatBytes(derived, block);
    }
    return derived.slice(0, length);
};

const fromBase64 = (value: string) => {
    try {
        return Uint8Array.from(atob(value), c => c.charCodeAt(0));
    }
    catch {
        return null;
    }
};

// Resolves with the private key, or null when the password is wrong or the data is not a legacy key
export const decryptLegacyPrivateKey = async (wallet: ILegacyWallet, password: string): Promise<string | null> => {
    const data = fromBase64(wallet.encKey);
    if (!data || data.length < 32 || bytesToHex(data.slice(0, 8)) !== bytesToHex(SALTED) || (data.length - 16) % 16 !== 0) {
        return null;
    }
    const derived = evpBytesToKey(utf8ToBytes(password), data.slice(8, 16), 48);
    let plain: string;
    try {
        const key = await globalThis.crypto.subtle.importKey('raw', derived.slice(0, 32), 'AES-CBC', false, ['decrypt']);
        const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-CBC', iv: derived.slice(32, 48) }, key, data.slice(16));
        plain = new TextDecoder('utf-8', { fatal: true }).decode(decrypted);
    }
    catch {
        // Bad padding (wrong password) or not text
        return null;
    }

    // A wrong password can still yield valid padding; only the stored public key proves the key
    const privateKey = plain.toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(privateKey) || !p256.utils.isValidSecretKey(hexToBytes(privateKey))) {
        return null;
    }
    if (wallet.publicKey) {
        const stored = wallet.publicKey.toLowerCase().replace(/^04/, '');
        const derivedPublic = bytesToHex(p256.getPublicKey(hexToBytes(privateKey), false)).replace(/^04/, '');
        if (stored !== derivedPublic) {
            return null;
        }
    }
    return privateKey;
};
