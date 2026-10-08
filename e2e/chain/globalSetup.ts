/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Once per run: builds the node from GO_IBAX_DIR and starts the PostgreSQL cluster all local
// networks keep their databases in. The temporary root is removed afterwards unless
// CHAIN_E2E_KEEP=1 (node logs: <root>/<suite>/node<i>/node.log).
import type { TestProject } from 'vitest/node';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildNode, killNodes, startPostgres } from './localChain';

declare module 'vitest' {
    export interface ProvidedContext {
        chain: { root: string; binary: string; postgres: { bin: string; port: number } };
    }
}

export default async function setup(project: TestProject) {
    if (!process.env.GO_IBAX_DIR) {
        throw new Error('GO_IBAX_DIR must point to a go-ibax checkout');
    }
    const root = mkdtempSync(path.join(tmpdir(), 'weaver-chain-'));
    const binary = await buildNode(path.resolve(process.env.GO_IBAX_DIR), root);
    const postgres = await startPostgres(root);
    project.provide('chain', { root, binary, postgres: { bin: postgres.bin, port: postgres.port } });

    return async () => {
        killNodes(root);
        await postgres.stop();
        if ('1' === process.env.CHAIN_E2E_KEEP) {
            console.log(`chain e2e files kept in ${root}`);
        }
        else {
            rmSync(root, { recursive: true, force: true });
        }
    };
}
