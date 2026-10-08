/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// npm run vectors:client: writes the client fields into go-ibax's vector files
// (GO_IBAX_DIR/tools/cryptovectors/testdata); go-ibax then fills in the node side
// (go run ./tools/cryptovectors gen) and npm run vectors:sync copies the result back here.
import { it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { writeContractParams, writeSuiteVectors, writeTransfers } from 'test/cryptovectors';

const FILES: [string, (doc: any) => unknown][] = [
    ['go-ibax-vectors.json', writeSuiteVectors],
    ['go-ibax-transfers.json', writeTransfers],
    ['go-ibax-contract-params.json', writeContractParams]
];

it('writes the client side of the go-ibax vectors', () => {
    if (!process.env.GO_IBAX_DIR) {
        throw new Error('GO_IBAX_DIR must point to a go-ibax checkout');
    }
    const dir = path.resolve(process.env.GO_IBAX_DIR, 'tools/cryptovectors/testdata');
    for (const [name, write] of FILES) {
        const file = path.join(dir, name);
        const doc = JSON.parse(readFileSync(file, 'utf8'));
        writeFileSync(file, JSON.stringify(write(doc), null, 2) + '\n');
    }
});
