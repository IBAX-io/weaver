/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// npm run vectors:sync: copies the vectors go-ibax committed (tools/cryptovectors/testdata) into
// the fixtures and records the go-ibax commit they come from. Refuses uncommitted vectors, so the
// recorded commit always holds exactly these bytes.
import { execFileSync } from 'node:child_process';
import { copyFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FILES = {
    'go-ibax-vectors.json': 'src/app/lib/crypto/fixtures',
    'go-ibax-addresses.json': 'src/app/lib/crypto/fixtures',
    'go-ibax-transfers.json': 'src/app/lib/tx/fixtures',
    'go-ibax-contract-params.json': 'src/app/lib/tx/fixtures'
};

const goIbax = process.env.GO_IBAX_DIR;
if (!goIbax) {
    console.error('GO_IBAX_DIR must point to a go-ibax checkout');
    process.exit(1);
}
const testdata = 'tools/cryptovectors/testdata';
const git = (...args) => execFileSync('git', ['-C', goIbax, ...args], { encoding: 'utf8' }).trim();
if (git('status', '--porcelain', '--', testdata)) {
    console.error(`${path.join(goIbax, testdata)} has uncommitted changes: commit them in go-ibax first`);
    process.exit(1);
}

for (const [name, target] of Object.entries(FILES)) {
    copyFileSync(path.join(goIbax, testdata, name), path.join(root, target, name));
}
writeFileSync(path.join(root, 'src/app/lib/crypto/fixtures/go-ibax-commit.txt'), `${git('rev-parse', 'HEAD')} ${testdata}\n`);
console.log(`Synced ${Object.keys(FILES).length} vector files from go-ibax ${git('rev-parse', '--short', 'HEAD')}`);
