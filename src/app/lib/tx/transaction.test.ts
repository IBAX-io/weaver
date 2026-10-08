/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { ICryptoSuiteId } from 'ibax/crypto';
import { signTransaction, TTxPayload } from './transaction';
import fixture from './fixtures/go-ibax-transfers.json';
import params from './fixtures/go-ibax-contract-params.json';
import Contract, { ContractParamError } from './contract';
import defaultSchema from './schema/defaultSchema';
import { DEFAULT_CRYPTO_SUITE, resolveCryptoSuite } from 'lib/crypto/suites';

// Transactions the node's own client-transaction entry point decoded (or rejected). The same inputs
// must reproduce the exact bytes the node took, but for the signature: hedged (fresh randomness in
// every nonce), it differs each time and must verify over the same transaction.
const cases = fixture.cases as unknown as {
    cryptoer: ICryptoSuiteId['cryptoer'];
    hasher: ICryptoSuiteId['hasher'];
    networkID: number;
    signedNetworkID?: number;
    tampered?: boolean;
    ecosystemID: number;
    time: number;
    privateKey: string;
    payload: TTxPayload;
    hash: string;
    data: string;
    node: { error?: string; type?: number; hash?: string; keyMatchesPublicKey?: boolean };
}[];

const PARAMS: { [name: string]: { type: string; value: unknown } } = {
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

// go-ibax converter.DecodeLength
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

// The client transaction's signed part (0x80, payload) and its signature
const split = (data: Uint8Array) => {
    const [payloadLength, payloadStart] = readLength(data, 1);
    const [signatureLength, signatureStart] = readLength(data, payloadStart + payloadLength);
    return {
        signed: bytesToHex(data.slice(0, payloadStart + payloadLength)),
        payload: data.slice(payloadStart, payloadStart + payloadLength),
        signature: bytesToHex(data.slice(signatureStart, signatureStart + signatureLength))
    };
};

// The bytes the node took, but for a signature of the same transaction by the same key
const expectSameTransaction = (data: Uint8Array, taken: string, suiteId: ICryptoSuiteId, privateKey: string) => {
    const ours = split(data);
    const theirs = split(hexToBytes(taken));
    expect(ours.signed).toBe(theirs.signed);
    const suite = resolveCryptoSuite(suiteId);
    const publicKey = suite.publicKey(privateKey);
    expect(suite.verify(suite.doubleHash(ours.payload), ours.signature, publicKey)).toBe(true);
    expect(suite.verify(suite.doubleHash(theirs.payload), theirs.signature, publicKey)).toBe(true);
    expect(ours.signature).not.toBe(theirs.signature);
};

const resign = (c: typeof cases[number]) => signTransaction(
    { ecosystemID: c.ecosystemID, networkID: c.signedNetworkID ?? c.networkID, cryptoSuite: { cryptoer: c.cryptoer, hasher: c.hasher }, time: c.time },
    c.payload,
    c.privateKey
);

describe('signTransaction', () => {
    it('reproduces the transfers the node accepted', () => {
        const accepted = cases.filter(c => !c.node.error);
        expect(accepted.length).toBeGreaterThan(0);
        for (const c of accepted) {
            const signed = resign(c);
            expectSameTransaction(signed.data, c.data, { cryptoer: c.cryptoer, hasher: c.hasher }, c.privateKey);
            expect(signed.hash).toBe(c.node.hash);
            expect(c.node.type).toBe(c.payload.type === 'utxo' ? 5 : 6);
            expect(c.node.keyMatchesPublicKey).toBe(true);
        }
    });

    it('keeps the node rejections that the UI must prevent (control)', () => {
        const errors = cases.filter(c => c.node.error).map(c => c.node.error);
        expect(new Set(errors)).toEqual(new Set([
            'error UTXO ToID must be a valid address',
            'error UTXO Value must be a positive integer',
            'error TransferSelf Value must be greater than zero',
            'error networkid invalid',
            'Incorrect sign'
        ]));
        for (const c of cases.filter(item => item.node.error && !item.tampered)) {
            expectSameTransaction(resign(c).data, c.data, { cryptoer: c.cryptoer, hasher: c.hasher }, c.privateKey);
        }
    });

    it('sets the contract id only for contract calls', () => {
        const context = { ecosystemID: 2, networkID: 5, cryptoSuite: { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' } as const, time: 1 };
        const key = cases[0].privateKey;
        const contract = signTransaction(context, { type: 'contract', id: 7, params: { A: '1' } }, key).body;
        const utxo = signTransaction(context, { type: 'utxo', toID: '597920150864192934', value: '1', comment: '' }, key).body;

        expect(contract.Header.ID).toBe(7n);
        expect(contract.UTXO).toBeUndefined();
        expect(utxo.Header.ID).toBe(0n);
        expect(utxo.Params).toBeUndefined();
        expect(utxo.Header.EcosystemID).toBe(2n);
    });

    it('refuses a payload it does not know', () => {
        const context = { ecosystemID: 1, networkID: 5, cryptoSuite: { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' } as const, time: 1 };
        expect(() => signTransaction(context, { type: 'mint' } as unknown as TTxPayload, cases[0].privateKey)).toThrow(TypeError);
    });
});

describe('contract parameters', () => {
    // Every parameter type a form can fill in, as the node's FillTxData converted it
    it('reproduces a call whose parameters the node accepted', () => {
        const signed = new Contract({
            id: params.contractID,
            schema: defaultSchema,
            ecosystemID: params.ecosystemID,
            networkID: params.networkID,
            cryptoSuite: DEFAULT_CRYPTO_SUITE,
            time: params.time,
            fields: PARAMS
        }).sign(params.privateKey);

        expectSameTransaction(signed.data, params.data, DEFAULT_CRYPTO_SUITE, params.privateKey);
        expect(Object.keys(params.node).sort()).toEqual(Object.keys(PARAMS).sort());
        expect(Object.entries(params.node).filter(([, result]) => result.startsWith('ERR'))).toEqual([]);
        // Whole floats reach the node as float64 (an msgpack integer would be refused)
        expect(params.node.F1).toBe('float64 5');
        expect(params.node.AD).toBe('int64 597920150864192934');
    });

    it('refuses values it cannot represent exactly', () => {
        const sign = (type: string, value: unknown) => () => new Contract({
            id: 1, schema: defaultSchema, ecosystemID: 1, networkID: 5, cryptoSuite: DEFAULT_CRYPTO_SUITE, time: 1,
            fields: { P: { type, value } }
        });
        for (const [type, value] of [
            ['int', '1.5'], ['int', '1,000'], ['int', '9223372036854775808'], ['int', 2 ** 60], ['int', 'abc'],
            ['float', 'abc'], ['float', '1,5'], ['float', Infinity],
            ['money', '0'], ['money', '0.0000000000001'], ['money', '1,5'], ['money', '-1'],
            ['address', '0059-7920-1508-6419-2935'], ['address', 'nobody']
        ] as [string, unknown][]) {
            expect([type, value, sign(type, value)]).toEqual([type, value, expect.any(Function)]);
            expect(sign(type, value)).toThrow(ContractParamError);
        }
        expect(sign('bytes', 'aa')).toThrow(expect.objectContaining({ reason: 'unsupported' }));
        expect(sign('map', '{}')).toThrow(expect.objectContaining({ reason: 'unsupported' }));
        // A type named like an Object method is still just unknown
        expect(sign('constructor', '1')).toThrow(expect.objectContaining({ reason: 'unsupported' }));
        expect(sign('toString', '1')).toThrow(expect.objectContaining({ reason: 'unsupported' }));
    });
});
