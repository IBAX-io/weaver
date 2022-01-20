/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable:no-bitwise
import { Uint64BE } from 'int64-buffer';

export const MONEY_POWER = 12;

export const toHex = (buffer: ArrayBuffer): string => {
    return Array.prototype.map.call(new Uint8Array(buffer), (x: number) =>
        ('00' + x.toString(16)).slice(-2)
    ).join('');
};

export const toArrayBuffer = (hex: string): ArrayBuffer => {
    const uint8 = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h =>
        parseInt(h, 16)
    ));

    return uint8.buffer;
};

export const encodeLength = (length: number): Uint8Array => {
    if (length >= 0 && length < 128) {
        const value = new Uint8Array(1);
        value[0] = length;
        return value;
    }

    const buffer = ((new Uint64BE(length)) as any).buffer;
    let i = 1;
    while (buffer[i] === 0 && i < buffer.length) {
        i++;
    }
    let offset = buffer.length - i;

    const uint8 = new Uint8Array(1 + offset);
    uint8[0] = 128 | offset;
    for (let n = 1; i <= buffer.length; n++ , i++) {
        uint8[n] = buffer[i];
    }

    return uint8;
};

export const concatBuffer = (a: Uint8Array | ArrayBuffer, b: Uint8Array | ArrayBuffer): ArrayBuffer => {
    if (a instanceof ArrayBuffer) {
        a = new Uint8Array(a);
    }

    if (b instanceof ArrayBuffer) {
        b = new Uint8Array(b);
    }

    const uint8 = new Uint8Array(a.length + b.length);

    uint8.set(a, 0);
    uint8.set(b, a.length);

    return uint8.buffer;
};

export const encodeLengthPlusData = (buffer: Uint8Array | ArrayBuffer): ArrayBuffer => {
    if (buffer instanceof ArrayBuffer) {
        buffer = new Uint8Array(buffer);
    }

    return concatBuffer(encodeLength(buffer.length), buffer);
};

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