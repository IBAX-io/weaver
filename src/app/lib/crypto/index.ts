/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable:no-bitwise
import jsrsasign from 'jsrsasign';
import CryptoJS, { SHA256, SHA512, LibWordArray } from 'crypto-js';
import crc64 from './crc64';
import Long from 'long';

export type THashInput =
    Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer;

const curveName = 'secp256r1';
const signAlg = 'SHA256withECDSA';
const addressLength = 20;

const remainder = (x: string, y: number) => {
    const a = parseInt(x.slice(0, x.length - 10), 10) % y;
    const b = parseInt(x.slice(10), 10) % y;
    return (a * (10 ** 10 % y) + b) % y;
};

export const checksum = (digits: number[]) => {
    let first = 0;
    let second = 0;
    let value = 0;

    for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        if (i & 1) {
            first += digit;
        }
        else {
            second += digit;
        }
    }
    value = (second + 3 * first) % 10;
    if (0 < value) {
        value = 10 - value;
    }
    return value;
};

export const privateToPublic = (privateKey: string) => {
    const curveParams = jsrsasign.crypto.ECParameterDB.getByName(curveName);
    const curveG = curveParams.G;
    const charLen = curveParams.keylen / 4;
    const privateBig = new jsrsasign.BigInteger(privateKey, 16);
    const publicBig = curveG.multiply(privateBig);
    const valueX = publicBig.getX().toBigInteger();
    const valueY = publicBig.getY().toBigInteger();
    const xHex = ('0000000000' + valueX.toString(16)).slice(-charLen);
    const yHex = ('0000000000' + valueY.toString(16)).slice(-charLen);
    return '04' + xHex + yHex;
};

export const sign = (data: string, privateKey: string): string => {
    const signature = new jsrsasign.crypto.Signature({ alg: signAlg });
    signature.init({ d: privateKey, curve: curveName });
    signature.updateHex(data);
    return signature.sign();
};

export const publicToID = (publicKey: string) => {
    if (publicKey.startsWith('04')) {
        const keyDigest = SHA256(CryptoJS.enc.Hex.parse(publicKey.slice(2)));
        const hashDigest = SHA512(keyDigest as any as LibWordArray).toString();
        const bytes = [];
        for (let i = 0; i < hashDigest.length; i += 2) {
            bytes.push(parseInt(hashDigest[i] + hashDigest[i + 1], 16));
        }
        const crc = crc64(bytes);
        const value = '0'.repeat(addressLength - crc.length) + crc;
        const crcDigits = value.split('').map(l => parseInt(l, 10));
        const addrChecksum = checksum(crcDigits.slice(0, -1));
        const crcLong = Long.fromString(crc);
        return crcLong.sub(remainder(crc, 10)).add(addrChecksum).toString();
    }
    else {
        throw new Error('Unsupported public key format');
    }
};

export const Sha256 = async (data: THashInput) => {
    if (!window.crypto || !window.crypto.subtle || !window.crypto.subtle.digest) {
        throw {
            type: 'E_CRYPTO_UNAVAILABLE'
        };
    }

    return await crypto.subtle.digest({ name: 'SHA-256' }, data);
};