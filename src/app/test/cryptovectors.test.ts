/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import suites from 'lib/crypto/fixtures/go-ibax-vectors.json';
import transfers from 'lib/tx/fixtures/go-ibax-transfers.json';
import params from 'lib/tx/fixtures/go-ibax-contract-params.json';
import { ALL_SUITES, IContractParamsFile, ISuiteVector, ITransferCase, writeContractParams, writeSuiteVectors, writeTransfers } from './cryptovectors';

// The fixtures come from go-ibax; their client fields must be what this client writes today
// (npm run vectors:client), and the node must have judged every one of them
describe('go-ibax vectors', () => {
    it('hold the client signatures this client writes, all accepted by the node', () => {
        const doc = suites as unknown as { vectors: ISuiteVector[] };
        expect(writeSuiteVectors(doc)).toEqual(doc);
        expect(doc.vectors.every(v => v.clientSignature)).toBe(true);
    });

    it('hold the transactions this client writes, each judged by the node', () => {
        const doc = transfers as unknown as { cases: ITransferCase[] };
        expect(writeTransfers(doc)).toEqual(doc);
        expect(doc.cases.filter(c => !c.node.error && !c.node.type)).toEqual([]);
    });

    it('cover every suite with transfers the node accepted', () => {
        const accepted = new Set((transfers.cases as unknown as ITransferCase[])
            .filter(c => !c.node.error)
            .map(c => `${c.cryptoer}/${c.hasher}`));
        expect([...accepted].sort()).toEqual(ALL_SUITES.map(s => `${s.cryptoer}/${s.hasher}`).sort());
    });

    it('hold the contract call this client writes, decoded by the node', () => {
        const doc = params as unknown as IContractParamsFile;
        expect(writeContractParams(doc)).toEqual(doc);
        expect(doc.header).not.toBe('');
    });
});
