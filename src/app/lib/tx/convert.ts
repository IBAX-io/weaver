/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concatBytes } from '@noble/hashes/utils.js';

// go-ibax converter.EncodeLength: one byte below 128, otherwise 0x80|n followed by n big-endian bytes
const encodeLength = (length: number): Uint8Array => {
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

// go-ibax converter.EncodeLengthPlusData
export const encodeLengthPlusData = (data: Uint8Array): Uint8Array => concatBytes(encodeLength(data.length), data);
