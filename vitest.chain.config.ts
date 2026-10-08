/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Chain tests (npm run test:chain): the client's own login, signing and API code against local
// go-ibax networks of every crypto suite. Needs Go, PostgreSQL and GO_IBAX_DIR.
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig(env => {
    const { resolve, define } = viteConfig(env);
    return {
        resolve,
        define,
        test: {
            include: ['e2e/chain/**/*.chain.ts'],
            environment: 'node',
            globals: false,
            globalSetup: ['e2e/chain/globalSetup.ts'],
            testTimeout: 120000,
            hookTimeout: 180000,
            fileParallelism: false
        }
    };
});
