/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const appRoot = fileURLToPath(new URL('./src/app', import.meta.url));
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Top-level folders of src/app are imported bare (e.g. `modules/auth`, `store`)
const APP_ROOTS = ['components', 'containers', 'images', 'lib', 'modules', 'services', 'styles', 'test', 'store'];

// public/settings.json is user-local (gitignored); seed it from the committed template
const seedSettings = (): Plugin => ({
    name: 'weaver-seed-settings',
    buildStart() {
        const target = fileURLToPath(new URL('./public/settings.json', import.meta.url));
        if (!existsSync(target)) {
            copyFileSync(fileURLToPath(new URL('./public/settings.json.dist', import.meta.url)), target);
        }
    }
});

export default defineConfig(({ mode }) => ({
    // The desktop build is loaded from file://, so asset URLs must be relative
    base: mode === 'desktop' ? './' : '/',
    plugins: [react(), seedSettings()],
    define: {
        __APP_VERSION__: JSON.stringify(version)
    },
    resolve: {
        alias: [
            {
                find: new RegExp(`^(${APP_ROOTS.join('|')})(?=/|$)`),
                replacement: `${appRoot}/$1`
            }
        ]
    },
    css: {
        preprocessorOptions: {
            scss: {
                loadPaths: [`${appRoot}/styles/scss`, fileURLToPath(new URL('./node_modules', import.meta.url))]
            }
        }
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        sourcemap: mode !== 'desktop'
    },
    server: {
        host: '127.0.0.1',
        port: 3000,
        strictPort: true
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        globals: false
    }
}));
