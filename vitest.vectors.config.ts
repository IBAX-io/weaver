/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Writes the client side of the vectors shared with go-ibax (npm run vectors:client); runs the
// app's own signing code, so it reuses the app's module resolution
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig(env => {
    const { resolve, define } = viteConfig(env);
    return {
        resolve,
        define,
        test: {
            include: ['scripts/*.vectors.ts'],
            environment: 'node',
            globals: false
        }
    };
});
