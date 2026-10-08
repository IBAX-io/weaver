/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Builds the desktop shell into build/ next to the page (vite.config.ts --mode desktop):
//   --mode main     src/electron/index.ts   -> build/electron/index.js (ESM, dependencies bundled)
//                   and build/package.json, the app manifest electron-builder packages
//   --mode preload  src/electron/preload.ts -> build/electron/preload.cjs (sandboxed preloads
//                   must be a single CommonJS script)
// Only `electron` and Node built-ins stay external, so the packaged app needs no node_modules.
import { defineConfig, Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const appManifest = (): Plugin => ({
    name: 'weaver-app-manifest',
    generateBundle() {
        this.emitFile({
            type: 'asset',
            fileName: 'package.json',
            source: JSON.stringify({
                name: pkg.name,
                productName: 'Weaver',
                version: pkg.version,
                description: pkg.description,
                author: pkg.author,
                license: pkg.license,
                type: 'module',
                main: 'electron/index.js'
            }, null, 2) + '\n'
        });
    }
});

export default defineConfig(({ mode }) => {
    const preload = mode === 'preload';
    return {
        root,
        publicDir: false,
        resolve: {
            alias: [{ find: /^ibax\/(.*)$/, replacement: `${root}src/defs/$1` }]
        },
        ssr: {
            noExternal: true,
            external: ['electron']
        },
        plugins: preload ? [] : [appManifest()],
        build: {
            ssr: true,
            target: 'node24',
            outDir: 'build',
            emptyOutDir: false,
            sourcemap: false,
            minify: false,
            rollupOptions: {
                input: { [preload ? 'preload' : 'index']: `src/electron/${preload ? 'preload' : 'index'}.ts` },
                external: ['electron'],
                output: preload
                    ? { format: 'cjs', entryFileNames: 'electron/[name].cjs' }
                    : { format: 'es', entryFileNames: 'electron/[name].js', chunkFileNames: 'electron/[name]-[hash].js' }
            }
        }
    };
});
