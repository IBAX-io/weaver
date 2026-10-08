/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// End-to-end tests of the built desktop app (npm run test:desktop); they start Electron, so
// they are not part of the unit test run
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['e2e/**/*.e2e.ts'],
        environment: 'node',
        testTimeout: 30000,
        fileParallelism: false
    }
});
