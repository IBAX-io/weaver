/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Account id (KeyID) derivation, mirroring go-ibax packages/common/crypto/converter.go:
//   Address(pub) = buildChecksumConvert(crc64_ECMA(sha512(Hash(pub))))
import { sha512 } from '@noble/hashes/sha2.js';

const ADDRESS_LENGTH = 20;
const UINT64_MASK = (1n << 64n) - 1n;
const CRC64_ECMA_POLY = 0xC96C5795D7870F42n;

const CRC64_TABLE = (() => {
    const table: bigint[] = [];
    for (let i = 0n; i < 256n; i++) {
        let crc = i;
        for (let j = 0; j < 8; j++) {
            crc = crc & 1n ? (crc >> 1n) ^ CRC64_ECMA_POLY : crc >> 1n;
        }
        table.push(crc);
    }
    return table;
})();

// Go's hash/crc64 Checksum (reflected, init/final xor all ones)
export const crc64 = (input: Uint8Array) => {
    let crc = UINT64_MASK;
    for (const byte of input) {
        crc = CRC64_TABLE[Number((crc ^ BigInt(byte)) & 0xFFn)] ^ (crc >> 8n);
    }
    return crc ^ UINT64_MASK;
};

// converter.CheckSum: a Luhn-like digit checksum over the decimal digits
export const checksumDigit = (digits: string) => {
    let one = 0;
    let two = 0;
    for (let i = 0; i < digits.length; i++) {
        const digit = digits.charCodeAt(i) - 48;
        if (i & 1) {
            one += digit;
        }
        else {
            two += digit;
        }
    }
    const value = (two + 3 * one) % 10;
    return value > 0 ? 10 - value : 0;
};

const repeatPrefixed = (value: string) => value.slice(0, ADDRESS_LENGTH).padStart(ADDRESS_LENGTH, '0');

// Returns the signed int64 account id as a decimal string, exactly like Go's int64(uint64)
export const keyIDFromDigest = (digest: Uint8Array) => {
    const crc = crc64(sha512(digest));
    const prefixed = repeatPrefixed(crc.toString(10));
    const sum = BigInt(checksumDigit(prefixed.slice(0, -1)));
    const value = (crc - (crc % 10n) + sum) & UINT64_MASK;
    return BigInt.asIntN(64, value).toString(10);
};

// "XXXX-XXXX-XXXX-XXXX-XXXX" as shown by the node (converter.AddressToString)
export const formatAddress = (keyID: string) => {
    const value = BigInt.asUintN(64, BigInt(keyID)).toString(10).padStart(ADDRESS_LENGTH, '0');
    return [0, 4, 8, 12, 16].map(i => value.slice(i, i + 4)).join('-');
};

const INT64_MIN = -(1n << 63n);
const UINT64_MAX = UINT64_MASK;

const isValidDigits = (digits: string) =>
    digits.length === ADDRESS_LENGTH && checksumDigit(digits.slice(0, -1)) === digits.charCodeAt(ADDRESS_LENGTH - 1) - 48;

// Account id of an address the user typed, or null when it is not a valid account. Mirrors
// go-ibax converter.AddressToID: "XXXX-XXXX-XXXX-XXXX-XXXX", a signed int64 id, or an unsigned id,
// and the checksum digit must match. Id 0 is rejected too: the node accepts it as a UTXO
// recipient, but it belongs to no key, so the coins would be lost.
export const parseAddress = (input: string): string | null => {
    const value = input.trim();
    let id: bigint;
    if (/^-\d+$/.test(value)) {
        id = BigInt(value);
        if (id < INT64_MIN) {
            return null;
        }
    }
    else if ((value.match(/-/g) || []).length === 4) {
        const digits = value.replace(/-/g, '');
        if (!/^\d{20}$/.test(digits)) {
            return null;
        }
        id = BigInt.asIntN(64, BigInt(digits));
        if (BigInt(digits) > UINT64_MAX) {
            return null;
        }
    }
    else if (/^\d+$/.test(value)) {
        const unsigned = BigInt(value);
        if (unsigned > UINT64_MAX) {
            return null;
        }
        id = BigInt.asIntN(64, unsigned);
    }
    else {
        return null;
    }

    if (id === 0n || !isValidDigits(BigInt.asUintN(64, id).toString(10).padStart(ADDRESS_LENGTH, '0'))) {
        return null;
    }
    return id.toString(10);
};
