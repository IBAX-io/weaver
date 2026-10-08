/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Client side of the cross-implementation vectors shared with go-ibax (tools/cryptovectors).
// The client writes what it signs (transactions, signatures); go-ibax writes what the node computes
// and whether it accepts it. Each function takes a vector file and returns it with every client
// field recomputed, keeping the node fields of unchanged cases, so the committed fixtures are up to
// date exactly when these functions leave them unchanged (cryptovectors.test.ts). Signatures are
// hedged (fresh randomness in every nonce), so signing again never gives the same bytes: a written
// signature is kept while it is over the same bytes and verifies, and replaced otherwise.
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { ICryptoSuiteId } from 'ibax/crypto';
import { resolveCryptoSuite } from 'lib/crypto/suites';
import { signTransaction, TTxPayload } from 'lib/tx/transaction';
import Contract, { IContractParam } from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';

// Every suite go-ibax implements (ECC_P512 is only named)
export const CRYPTOERS: ICryptoSuiteId['cryptoer'][] = ['ECC_Secp256k1', 'ECC_P256', 'SM2', 'MLDSA65'];
export const HASHERS: ICryptoSuiteId['hasher'][] = ['SHA256', 'KECCAK256', 'SHA3_256', 'SM3'];
export const ALL_SUITES: ICryptoSuiteId[] = CRYPTOERS.flatMap(cryptoer => HASHERS.map(hasher => ({ cryptoer, hasher })));

// Test keys only
const TRANSFER_KEY = 'e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f';
const SECOND_TRANSFER_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';
const TRANSFER_CONTEXT = { networkID: 5, ecosystemID: 1, time: 1760000000 };

// Accepted by the node, then the refusals the UI must prevent
const TRANSFER_PAYLOADS: TTxPayload[] = [
    { type: 'utxo', toID: '597920150864192934', value: '1500000000000', comment: '' },
    { type: 'utxo', toID: '-2568234799998900389', value: '1', comment: 'Invoice #42 — ünïcode' },
    { type: 'transferSelf', value: '250000000000', direction: 'toUTXO' },
    { type: 'transferSelf', value: '99999999999999999999', direction: 'toAccount' },
    { type: 'utxo', toID: '597920150864192935', value: '1', comment: '' },
    { type: 'utxo', toID: '597920150864192934', value: '1.5', comment: '' },
    { type: 'transferSelf', value: '0', direction: 'toUTXO' }
];

// Every contract parameter type a form can fill in
export const CONTRACT_PARAMS: { [name: string]: IContractParam } = {
    I1: { type: 'int', value: '42' },
    I2: { type: 'int', value: '-9223372036854775808' },
    I3: { type: 'int', value: '9223372036854775807' },
    I4: { type: 'int', value: 7 },
    F1: { type: 'float', value: '5' },
    F2: { type: 'float', value: '2.5' },
    F3: { type: 'float', value: 7 },
    F4: { type: 'float', value: '-1e3' },
    M1: { type: 'money', value: '1.5' },
    M2: { type: 'money', value: '0.000000000001' },
    S1: { type: 'string', value: 'héllo' },
    B1: { type: 'bool', value: 'true' },
    A1: { type: 'array', value: ['a', 'b'] },
    AD: { type: 'address', value: '0059-7920-1508-6419-2934' },
    FL: { type: 'file', value: { name: 'a.txt', type: 'text/plain', value: new Uint8Array([104, 105]).buffer } }
};

export interface ITransferCase {
    cryptoer: ICryptoSuiteId['cryptoer'];
    hasher: ICryptoSuiteId['hasher'];
    networkID: number;
    // Signed for another network than the node's
    signedNetworkID?: number;
    // Payload altered after signing
    tampered?: boolean;
    ecosystemID: number;
    time: number;
    privateKey: string;
    payload: TTxPayload;
    hash: string;
    data: string;
    node: { error?: string; type?: number; hash?: string; keyMatchesPublicKey?: boolean };
}

type TTransferInput = Omit<ITransferCase, 'hash' | 'data' | 'node'>;

const transferInputs = (): TTransferInput[] => {
    const group = (suite: ICryptoSuiteId, privateKey: string) =>
        TRANSFER_PAYLOADS.map(payload => ({ ...suite, ...TRANSFER_CONTEXT, privateKey, payload }));
    const [first] = TRANSFER_PAYLOADS;
    return [
        ...ALL_SUITES.flatMap(suite => [
            ...group(suite, TRANSFER_KEY),
            // A second key on the client's default suite
            ...(suite.cryptoer === DEFAULT_CRYPTO_SUITE.cryptoer && suite.hasher === DEFAULT_CRYPTO_SUITE.hasher ? group(suite, SECOND_TRANSFER_KEY) : [])
        ]),
        { cryptoer: 'ECC_Secp256k1', hasher: 'SHA256', networkID: 5, signedNetworkID: 1, ecosystemID: 1, time: TRANSFER_CONTEXT.time, privateKey: TRANSFER_KEY, payload: first },
        { cryptoer: 'ECC_Secp256k1', hasher: 'SHA256', networkID: 5, tampered: true, ecosystemID: 1, time: TRANSFER_CONTEXT.time, privateKey: TRANSFER_KEY, payload: first }
    ];
};

// Flips the lowest bit of the payload's last byte (a letter of Lang), so the payload still decodes
// but no longer matches the signature
export const tamperTransaction = (data: Uint8Array) => {
    // 0x80 | EncodeLength(payload) | payload | ...: one length byte below 128, else 0x80|n and n bytes
    const lengthBytes = data[1] < 0x80 ? 0 : data[1] & 0x7F;
    const payloadLength = lengthBytes ? data.slice(2, 2 + lengthBytes).reduce((length, byte) => length * 256 + byte, 0) : data[1];
    const tampered = data.slice();
    tampered[2 + lengthBytes + payloadLength - 1] ^= 0x01;
    return tampered;
};

// go-ibax converter.DecodeLength: the length and where the bytes it counts start
const readLength = (data: Uint8Array, offset: number): [number, number] => {
    const first = data[offset];
    if (first < 128) {
        return [first, offset + 1];
    }
    let length = 0;
    for (let i = 1; i <= (first & 0x7F); i++) {
        length = length * 256 + data[offset + i];
    }
    return [length, offset + 1 + (first & 0x7F)];
};

// A client transaction's signed part (0x80, payload) and its signature
export const splitTransaction = (data: Uint8Array) => {
    const [payloadLength, payloadStart] = readLength(data, 1);
    const [signatureLength, signatureStart] = readLength(data, payloadStart + payloadLength);
    return {
        signed: bytesToHex(data.slice(0, payloadStart + payloadLength)),
        payload: data.slice(payloadStart, payloadStart + payloadLength),
        signature: bytesToHex(data.slice(signatureStart, signatureStart + signatureLength))
    };
};

// The written transaction is the fresh one but for the signature, which verifies (as utils.CheckSign:
// over DoubleHash(payload)) with the key's public key
const sameTransaction = (written: Uint8Array, fresh: Uint8Array, suiteId: ICryptoSuiteId, privateKey: string) => {
    const ours = splitTransaction(fresh);
    const theirs = splitTransaction(written);
    const suite = resolveCryptoSuite(suiteId);
    return ours.signed === theirs.signed &&
        suite.verify(suite.doubleHash(theirs.payload), theirs.signature, suite.publicKey(privateKey));
};

export const signTransferCase = (c: TTransferInput) => {
    const signed = signTransaction(
        { ecosystemID: c.ecosystemID, networkID: c.signedNetworkID ?? c.networkID, cryptoSuite: { cryptoer: c.cryptoer, hasher: c.hasher }, time: c.time },
        c.payload,
        c.privateKey
    );
    return { hash: signed.hash, data: bytesToHex(c.tampered ? tamperTransaction(signed.data) : signed.data) };
};

const inputKey = (c: TTransferInput) => JSON.stringify([
    c.cryptoer, c.hasher, c.networkID, c.signedNetworkID, c.tampered, c.ecosystemID, c.time, c.privateKey, c.payload
]);

export const writeTransfers = <T extends { cases: ITransferCase[] }>(doc: T): T => {
    const nodeOf = new Map(doc.cases.map(c => [inputKey(c), c] as const));
    return {
        ...doc,
        cases: transferInputs().map(input => {
            const known = nodeOf.get(inputKey(input));
            if (known) {
                const fresh = signTransaction(
                    { ecosystemID: input.ecosystemID, networkID: input.signedNetworkID ?? input.networkID, cryptoSuite: { cryptoer: input.cryptoer, hasher: input.hasher }, time: input.time },
                    input.payload,
                    input.privateKey
                );
                // A tampered case was signed before its payload was altered: checked as signed
                const written = hexToBytes(known.data);
                if (known.hash === fresh.hash && sameTransaction(input.tampered ? tamperTransaction(written) : written, fresh.data, input, input.privateKey)) {
                    return { ...input, hash: known.hash, data: known.data, node: known.node };
                }
            }
            // A new or changed case waits for go-ibax to fill in the node's verdict
            return { ...input, ...signTransferCase(input), node: {} };
        })
    };
};

export interface ISuiteVector {
    cryptoer: ICryptoSuiteId['cryptoer'];
    hasher: ICryptoSuiteId['hasher'];
    privateKey: string;
    message: string;
    payload: string;
    publicKey: string;
    keyID: string;
    goSignature: string | null;
    clientSignature?: string;
}

// The client's transaction signature over payload; the node checks it as Verify(DoubleHash(payload))
export const writeSuiteVectors = <T extends { vectors: ISuiteVector[] }>(doc: T): T => ({
    ...doc,
    vectors: doc.vectors.map(v => {
        const suite = resolveCryptoSuite({ cryptoer: v.cryptoer, hasher: v.hasher });
        const digest = suite.doubleHash(hexToBytes(v.payload));
        return v.clientSignature && suite.verify(digest, v.clientSignature, suite.publicKey(v.privateKey))
            ? v
            : { ...v, clientSignature: suite.sign(digest, v.privateKey) };
    })
});

export interface IContractParamsFile {
    privateKey: string;
    contractID: number;
    ecosystemID: number;
    networkID: number;
    time: number;
    types: { [name: string]: string };
    data: string;
    header: string;
    node: { [name: string]: string };
}

export const signContractParams = (doc: IContractParamsFile) => new Contract({
    id: doc.contractID,
    schema: defaultSchema,
    ecosystemID: doc.ecosystemID,
    networkID: doc.networkID,
    cryptoSuite: DEFAULT_CRYPTO_SUITE,
    time: doc.time,
    fields: CONTRACT_PARAMS
}).sign(doc.privateKey);

export const writeContractParams = <T extends IContractParamsFile>(doc: T): T => {
    const fresh = signContractParams(doc).data;
    const kept = !!doc.data && sameTransaction(hexToBytes(doc.data), fresh, DEFAULT_CRYPTO_SUITE, doc.privateKey);
    const data = kept ? doc.data : bytesToHex(fresh);
    const names = Object.keys(CONTRACT_PARAMS).sort();
    const types = Object.fromEntries(names.map(name => [name, CONTRACT_PARAMS[name].type]));
    const unchanged = data === doc.data && JSON.stringify(Object.keys(doc.types ?? {}).sort().map(name => [name, doc.types[name]])) ===
        JSON.stringify(names.map(name => [name, types[name]]));
    return { ...doc, types, data, ...(unchanged ? {} : { header: '', node: {} }) };
};
