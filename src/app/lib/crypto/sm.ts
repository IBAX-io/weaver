/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The Chinese commercial algorithms an IBAX node can be configured with (go-ibax `--hashAlgo SM3`,
// `--cryptoer SM2`): the SM3 hash (GB/T 32905-2016) and SM2 signatures (GB/T 32918.2-2016), as
// go-ibax computes them with github.com/tjfoc/gmsm v1.4.1:
//   SM2 sign(d, m): e = SM3(ZA || m), ZA = SM3(ENTL || ID || a || b || Gx || Gy || x || y) with the
//   default ID "1234567812345678"; r = (e + x1) mod n where (x1, y1) = kG; s = (1 + d)^-1 (k - rd)
//   mod n; the signature is the DER SEQUENCE { INTEGER r, INTEGER s } (minimal: up to 72 bytes,
//   fewer when r or s has leading zero bytes).
// Point and field arithmetic and DER are @noble/curves' (audited); only the SM2 equations and SM3
// are written here.
import { DER, weierstrass } from '@noble/curves/abstract/weierstrass.js';
import { bytesToNumberBE, createHmacDrbg, numberToBytesBE } from '@noble/curves/utils.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { concatBytes, hexToBytes, randomBytes, rotl } from '@noble/hashes/utils.js';

// ---------------------------------------------------------------------------------------- SM3

const SM3_IV = [0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600, 0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e];

const p0 = (x: number) => x ^ rotl(x, 9) ^ rotl(x, 17);
const p1 = (x: number) => x ^ rotl(x, 15) ^ rotl(x, 23);

export const sm3 = (data: Uint8Array): Uint8Array => {
    // Padding: a 1 bit, zeros up to 448 mod 512, the length in bits as 64 bits
    const blocks = Math.ceil((data.length + 9) / 64);
    const padded = new Uint8Array(blocks * 64);
    padded.set(data);
    padded[data.length] = 0x80;
    const view = new DataView(padded.buffer);
    const bits = data.length * 8;
    view.setUint32(padded.length - 8, Math.floor(bits / 0x100000000), false);
    view.setUint32(padded.length - 4, bits >>> 0, false);

    const v = [...SM3_IV];
    const w = new Uint32Array(68);
    const w1 = new Uint32Array(64);
    for (let block = 0; block < blocks; block++) {
        for (let j = 0; j < 16; j++) {
            w[j] = view.getUint32(block * 64 + j * 4, false);
        }
        for (let j = 16; j < 68; j++) {
            w[j] = p1(w[j - 16] ^ w[j - 9] ^ rotl(w[j - 3], 15)) ^ rotl(w[j - 13], 7) ^ w[j - 6];
        }
        for (let j = 0; j < 64; j++) {
            w1[j] = w[j] ^ w[j + 4];
        }
        let [a, b, c, d, e, f, g, h] = v;
        for (let j = 0; j < 64; j++) {
            const t = j < 16 ? 0x79cc4519 : 0x7a879d8a;
            const ss1 = rotl((rotl(a, 12) + e + rotl(t, j % 32)) | 0, 7);
            const ss2 = ss1 ^ rotl(a, 12);
            const ff = j < 16 ? a ^ b ^ c : (a & b) | (a & c) | (b & c);
            const gg = j < 16 ? e ^ f ^ g : (e & f) | (~e & g);
            const tt1 = (ff + d + ss2 + w1[j]) | 0;
            const tt2 = (gg + h + ss1 + w[j]) | 0;
            d = c;
            c = rotl(b, 9);
            b = a;
            a = tt1;
            h = g;
            g = rotl(f, 19);
            f = e;
            e = p0(tt2);
        }
        [a, b, c, d, e, f, g, h].forEach((word, i) => {
            v[i] = (v[i] ^ word) >>> 0;
        });
    }
    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    v.forEach((word, i) => outView.setUint32(i * 4, word, false));
    return out;
};

// ---------------------------------------------------------------------------------------- SM2

// The SM2 recommended curve (GB/T 32918.5-2017), as gmsm defines it (sm2/p256.go)
const SM2_CURVE = {
    p: BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF'),
    n: BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123'),
    h: BigInt(1),
    a: BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC'),
    b: BigInt('0x28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93'),
    Gx: BigInt('0x32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7'),
    Gy: BigInt('0xBC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0')
};
const SM2Point = weierstrass(SM2_CURVE);
const Fn = SM2Point.Fn;
const N = SM2_CURVE.n;
// gmsm's default_uid
const DEFAULT_ID = new TextEncoder().encode('1234567812345678');
// Nonce candidates tried at most: each is out of range with a chance of about 2^-32
const MAX_NONCES = 64;

const be32 = (n: bigint) => numberToBytesBE(n, 32);

const privateScalar = (privateKey: Uint8Array) => {
    const d = bytesToNumberBE(privateKey);
    // 1 <= d <= n - 2: (1 + d) must have an inverse
    if (32 !== privateKey.length || d < BigInt(1) || d > N - BigInt(2)) {
        throw new Error('Invalid SM2 private key');
    }
    return d;
};

// Whether a private key can be used with SM2 (its range is smaller than secp256k1's and P-256's)
export const isValidSm2PrivateKey = (privateKey: Uint8Array) => {
    const d = bytesToNumberBE(privateKey);
    return 32 === privateKey.length && d >= BigInt(1) && d <= N - BigInt(2);
};

// Uncompressed public key: 04 || x || y
export const sm2PublicKey = (privateKey: Uint8Array): Uint8Array =>
    SM2Point.BASE.multiply(privateScalar(privateKey)).toBytes(false);

// ZA of a public key and the default ID
const za = (point: InstanceType<typeof SM2Point>) => {
    const { x, y } = point.toAffine();
    const entl = DEFAULT_ID.length * 8;
    return sm3(concatBytes(
        new Uint8Array([entl >> 8, entl & 0xff]), DEFAULT_ID,
        be32(SM2_CURVE.a), be32(SM2_CURVE.b), be32(SM2_CURVE.Gx), be32(SM2_CURVE.Gy), be32(x), be32(y)
    ));
};

// The signature from nonce candidates (DER, strict and minimal as Go's encoding/asn1 writes it).
// (1 + d)^-1 is taken blinded by a random b, so its timing does not follow the key.
const signWith = (message: Uint8Array, privateKey: Uint8Array, nonce: (attempt: number) => bigint) => {
    const d = privateScalar(privateKey);
    const e = bytesToNumberBE(sm3(concatBytes(za(SM2Point.BASE.multiply(d)), message)));
    for (let attempt = 0; attempt < MAX_NONCES; attempt++) {
        const k = nonce(attempt);
        if (k < BigInt(1) || k >= N) {
            continue;
        }
        const r = Fn.create(e + SM2Point.BASE.multiply(k).toAffine().x);
        if (r === BigInt(0) || r + k === N) {
            continue;
        }
        const b = Fn.create(bytesToNumberBE(randomBytes(32))) || BigInt(1);
        const s = Fn.mul(Fn.mul(Fn.inv(Fn.mul(b, d + BigInt(1))), b), Fn.create(k - r * d));
        if (s !== BigInt(0)) {
            return hexToBytes(DER.hexFromSig({ r, s }));
        }
    }
    throw new Error('No SM2 nonce found');
};

// The standard's example signs with a given k: for its test only
export const sm2SignWithNonceForTest = signWith;

// The nonce: hedged (RFC 6979 section 3.6), from the key, the digest, fresh random bytes and the
// algorithm's name. The random bytes make the same key never reuse a nonce across algorithms
// (secp256k1 and P-256 sign with the same key); the key and digest keep a weak random source from
// leaking it.
const drbg = createHmacDrbg<bigint>(32, 32, (key, ...messages) => hmac(sha256, key, concatBytes(...messages)));
const DOMAIN = new TextEncoder().encode('SM2');

// SM2 signature of a message (go-ibax passes the configured hash of the data) as DER
export const sm2Sign = (message: Uint8Array, privateKey: Uint8Array): Uint8Array => {
    const seed = concatBytes(privateKey, sm3(message), randomBytes(32), DOMAIN);
    return signWith(message, privateKey, attempt => drbg(concatBytes(seed, numberToBytesBE(attempt, 4)), bytes => {
        const k = bytesToNumberBE(bytes);
        return k >= BigInt(1) && k < N ? k : undefined;
    }));
};

export const sm2Verify = (message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean => {
    let r: bigint;
    let s: bigint;
    let point;
    try {
        ({ r, s } = DER.toSig(signature));
        point = SM2Point.fromBytes(publicKey);
        point.assertValidity();
    }
    catch (e) {
        return false;
    }
    if (r < BigInt(1) || r >= N || s < BigInt(1) || s >= N) {
        return false;
    }
    const t = Fn.create(r + s);
    if (t === BigInt(0)) {
        return false;
    }
    const e = bytesToNumberBE(sm3(concatBytes(za(point), message)));
    const sum = SM2Point.BASE.multiply(s).add(point.multiply(t));
    if (sum.is0()) {
        return false;
    }
    return Fn.create(e + sum.toAffine().x) === r;
};
