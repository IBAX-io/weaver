/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { isValidSm2PrivateKey, sm2PublicKey, sm2Sign, sm2SignWithNonceForTest, sm2Verify, sm3 } from './sm';

// GM/T 0003.5-2012 example on the recommended curve: key, message and nonce, with r and s
const D = hexToBytes('3945208F7B2144B13F36E38AC6D39F95889393692860B51A42FB81EF4DF7C5B8');
const MESSAGE = utf8ToBytes('message digest');
const K = BigInt('0x59276E27D506861A16680F3AD9C02DCCEF3CC1FA3CDBE4CE6D54B80DEAC1BC21');
const R = 'f5a03b0648d2c4630eeac513e1bb81a15944da3827d5b74143ac7eaceee720b3';
const S = 'b1b6aa29df212fd8763182bc0d421ca1bb9038fd1f7f42d4840b69c485bbc1aa';
const PUBLIC = '04' + '09f9df311e5421a150dd7d161e4bc5c672179fad1833fc076bb08ff356f35020' + 'ccea490ce26775a52dc6ea718cc1aa600aed05fbf35e084a6632f6072da9ad13';

describe('SM3 (GB/T 32905-2016)', () => {
    it('hashes as the standard\'s examples', () => {
        expect(bytesToHex(sm3(utf8ToBytes('abc')))).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
        expect(bytesToHex(sm3(utf8ToBytes('abcd'.repeat(16))))).toBe('debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
    });

    it('pads every length as gmsm does: around a block and past it', () => {
        // github.com/tjfoc/gmsm v1.4.1 sm3.Sm3Sum of n bytes 'a' (the node's SM3)
        const GMSM: [number, string][] = [
            [0, '1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b'],
            [55, '288337eef51eec62e7544d7270424c8dbe656254c99852870a73b2453a6a7fb1'],
            [56, 'ba00ebedaab54065a5fd4f9f56326016203166bcee3eed44ea868d59d67aa3c8'],
            [63, '587308543551881ebd70d27ad358ff5dcdf24ac54822e2f7b7c3edce0985d21b'],
            [64, '616ec433c359e7c2b19f360e2b8f2a1b6e9ed76b8dc1a7d207b31a5341c611e9'],
            [65, '3d1d94afa238ec3e2bbc20ad504702b24c16f2889c94973f2f8da3526c44e4bc'],
            [119, '53282a90724e9eb79b18d06b5b8f7f02d046e18b29247dcdb064a136d5c4459a'],
            [120, '4c9f0fe9f36ffe0191af73560c4afb1b671be02ba2d0e0c161b1e03488c2a45c'],
            [1000, 'f4bedca973227d45c5b822551d2e762d4cfb0e9af70b241452545727b5fb046f']
        ];
        expect(GMSM.map(([n]) => [n, bytesToHex(sm3(new Uint8Array(n).fill(0x61)))])).toEqual(GMSM);
    });
});

describe('SM2 signatures (GB/T 32918.2-2016, as gmsm makes them)', () => {
    it('signs the standard\'s example to its r and s, in DER', () => {
        expect(bytesToHex(sm2PublicKey(D))).toBe(PUBLIC);
        expect(bytesToHex(sm2SignWithNonceForTest(MESSAGE, D, () => K))).toBe(`3046022100${R}022100${S}`);
        // A candidate out of range is passed over for the next
        expect(bytesToHex(sm2SignWithNonceForTest(MESSAGE, D, attempt => 0 === attempt ? BigInt(0) : K))).toBe(`3046022100${R}022100${S}`);
    });

    it('verifies its own signatures and no others', () => {
        const signature = sm2Sign(MESSAGE, D);
        expect(sm2Verify(MESSAGE, signature, sm2PublicKey(D))).toBe(true);
        expect(sm2Verify(utf8ToBytes('message digesT'), signature, sm2PublicKey(D))).toBe(false);
        expect(sm2Verify(MESSAGE, signature, sm2PublicKey(hexToBytes('01'.padStart(64, '0'))))).toBe(false);
        // Hedged: fresh randomness in every nonce, so the same message is never signed the same way
        const again = sm2Sign(MESSAGE, D);
        expect(bytesToHex(again)).not.toBe(bytesToHex(signature));
        expect(sm2Verify(MESSAGE, again, sm2PublicKey(D))).toBe(true);
    });

    it('refuses what Go\'s encoding/asn1 refuses, and values out of range', () => {
        const valid = hexToBytes(`3046022100${R}022100${S}`);
        expect(sm2Verify(MESSAGE, valid, hexToBytes(PUBLIC))).toBe(true);
        for (const [what, hex] of [
            // Stricter than the node here: Go's asn1.Unmarshal leaves bytes after the SEQUENCE unread
            ['trailing data', `3046022100${R}022100${S}00`],
            ['a wrong length', `3047022100${R}022100${S}`],
            ['a leading zero too many', `304702220000${R}022100${S}`],
            ['a negative r', `30450220${R}022100${S}`],
            ['r and s swapped', `3046022100${S}022100${R}`],
            ['r zero', `3025020100022100${S}`],
            ['no signature', '']
        ] as [string, string][]) {
            expect([what, sm2Verify(MESSAGE, hexToBytes(hex), hexToBytes(PUBLIC))]).toEqual([what, false]);
        }
        // Each breaks one rule only, and would verify if that rule were not checked
        const n = BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123');
        const sPlusN = (BigInt('0x' + S) + n).toString(16).padStart(66, '0');
        for (const [what, hex] of [
            // Inside the SEQUENCE's length
            ['data after s', `3049022100${R}022100${S}020100`],
            // s + n: the same point, out of range
            ['s not below n', `3046022100${R}0221${sPlusN}`],
            // r + s = n: t is 0, which no point multiplies by (refused, not thrown)
            ['r + s = n', `3026020105022100${(n - BigInt(5)).toString(16)}`]
        ] as [string, string][]) {
            expect([what, sm2Verify(MESSAGE, hexToBytes(hex), hexToBytes(PUBLIC))]).toEqual([what, false]);
        }
        // An r with a high byte below 0x80, written with a zero byte too many
        let message = 0;
        let signature = sm2Sign(new Uint8Array([message]), D);
        while (signature[4] >= 0x80 || 0x20 !== signature[3]) {
            signature = sm2Sign(new Uint8Array([++message]), D);
        }
        const padded = new Uint8Array([0x30, signature[1] + 1, 0x02, 0x21, 0x00, ...signature.subarray(4)]);
        expect(sm2Verify(new Uint8Array([message]), signature, hexToBytes(PUBLIC))).toBe(true);
        expect(sm2Verify(new Uint8Array([message]), padded, hexToBytes(PUBLIC))).toBe(false);
        // A point off the curve
        expect(sm2Verify(MESSAGE, valid, hexToBytes(PUBLIC.slice(0, -2) + '14'))).toBe(false);
    });

    it('refuses private keys the curve cannot use', () => {
        // SM2's order is below secp256k1's and P-256's: n - 1 is a key on those, not on SM2
        const n = BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123');
        expect(isValidSm2PrivateKey(hexToBytes((n - BigInt(2)).toString(16)))).toBe(true);
        expect(isValidSm2PrivateKey(hexToBytes((n - BigInt(1)).toString(16)))).toBe(false);
        expect(() => sm2PublicKey(new Uint8Array(32))).toThrow();
        expect(() => sm2PublicKey(hexToBytes('FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54122'))).toThrow();
        expect(() => sm2PublicKey(new Uint8Array(31).fill(1))).toThrow();
    });
});
