/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const MONEY_POWER = 12;

export const toHex = (bytes: Uint8Array | ArrayBuffer): string =>
    Array.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes, x => x.toString(16).padStart(2, '0')).join('');

export const toArrayBuffer = (hex: string): ArrayBuffer => {
    const uint8 = new Uint8Array((hex.match(/[\da-f]{2}/gi) || []).map(h => parseInt(h, 16)));
    return uint8.buffer;
};

// go-ibax converter.EncodeLength: one byte below 128, otherwise 0x80|n followed by n big-endian bytes
export const encodeLength = (length: number): Uint8Array => {
    if (length >= 0 && length < 128) {
        return Uint8Array.of(length);
    }

    const bytes: number[] = [];
    let rest = BigInt(length);
    while (rest > 0n) {
        bytes.unshift(Number(rest & 0xFFn));
        rest >>= 8n;
    }
    return Uint8Array.of(0x80 | bytes.length, ...bytes);
};

export const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
    const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }
    return result;
};

export const encodeLengthPlusData = (data: Uint8Array): Uint8Array => concatBytes(encodeLength(data.length), data);

export const toMoney = (value: number | string) => {
    const match = /([\d]+)((\.|,)([\d]+))?/.exec(String(value));
    if (!match) {
        return null;
    }
    const integer = match[1];
    const fraction = match[4] || '';
    let result = integer;
    for (let i = 0; i < MONEY_POWER; i++) {
        const val = fraction.length <= i ? '0' : fraction[i];
        result += val;
    }
    if (fraction.length > MONEY_POWER) {
        result = result + `.${fraction.slice(MONEY_POWER, MONEY_POWER * 2)}`;
    }
    return result;
};
