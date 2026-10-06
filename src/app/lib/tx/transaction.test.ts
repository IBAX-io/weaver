/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { bytesToHex } from '@noble/hashes/utils.js';
import { ICryptoSuiteId } from 'ibax/crypto';
import { signTransaction, TTxPayload } from './transaction';
import { fromBaseUnits, toBaseUnits } from './amount';
import fixture from './fixtures/go-ibax-transfers.json';

// Transactions the node's own client-transaction entry point decoded (or rejected); signing is
// deterministic (RFC 6979), so the same inputs must reproduce the exact bytes.
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
            expect(bytesToHex(signed.data)).toBe(c.data);
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
            expect(bytesToHex(resign(c).data)).toBe(c.data);
        }
    });

    it('sets the contract id only for contract calls', () => {
        const context = { ecosystemID: 2, networkID: 5, cryptoSuite: { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' } as const, time: 1 };
        const key = cases[0].privateKey;
        const contract = signTransaction(context, { type: 'contract', id: 7, params: { A: '1' } }, key).body;
        const utxo = signTransaction(context, { type: 'utxo', toID: '597920150864192934', value: '1', comment: '' }, key).body;

        expect(contract.Header.ID).toBe(7);
        expect(contract.UTXO).toBeUndefined();
        expect(utxo.Header.ID).toBe(0);
        expect(utxo.Params).toBeUndefined();
        expect(utxo.Header.EcosystemID).toBe(2);
    });
});

describe('amounts', () => {
    it('converts to base units without rounding', () => {
        expect(toBaseUnits('1.5', 12)).toBe('1500000000000');
        expect(toBaseUnits('0,25', 2)).toBe('25');
        expect(toBaseUnits('.5', 1)).toBe('5');
        expect(toBaseUnits('7', 0)).toBe('7');
        expect(toBaseUnits(' 2.000 ', 3)).toBe('2000');
        expect(toBaseUnits('99999999999999999999', 12)).toBe('99999999999999999999000000000000');
    });

    it('refuses amounts the node would reject or the user did not mean', () => {
        for (const value of ['', '.', '0', '0.000', '-1', '1e3', '1.2.3', 'abc', '1.0001']) {
            expect([value, toBaseUnits(value, 3)]).toEqual([value, null]);
        }
        expect(toBaseUnits('1.5', 0)).toBeNull();
    });

    it('formats base units for display', () => {
        expect(fromBaseUnits('1500000000000', 12)).toBe('1.5');
        expect(fromBaseUnits('0', 12)).toBe('0');
        expect(fromBaseUnits('5', 3)).toBe('0.005');
        expect(fromBaseUnits('007000', 3)).toBe('7');
        expect(fromBaseUnits('-25', 2)).toBe('-0.25');
        expect(fromBaseUnits('12', 0)).toBe('12');
        for (const value of ['1', '1500000000000', '123456789012345678901234567890']) {
            expect(toBaseUnits(fromBaseUnits(value, 12), 12)).toBe(value);
        }
    });
});
