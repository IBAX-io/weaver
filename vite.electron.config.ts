/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Builds the desktop shell into build/ next to the page (vite.config.ts --mode desktop):
//   --mode main     src/electron/index.ts   -> build/electron/index.js (ESM, dependencies bundled)
//                   src/electron/pkcs11/host.ts -> build/electron/pkcs11Host.js, the PKCS#11 process
//                   and build/package.json, the app manifest electron-builder packages
//   --mode preload  src/electron/preload.ts -> build/electron/preload.cjs (sandboxed preloads
//                   must be a single CommonJS script)
//                   and build/koffi/<platform>_<arch>/koffi.node, koffi's native binary
// Only `electron` and Node built-ins stay external, so the packaged app needs no node_modules.
// The bundled koffi finds its binary in node_modules when the app runs from build/, and at
// <resources>/koffi once packaged, copied there from build/koffi (electron-builder.config.mjs).
import { defineConfig, Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

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

// koffi's binary for the platform the app is built on, from the package yarn installed for it
const koffiNative = (): Plugin => ({
    name: 'weaver-koffi-native',
    generateBundle() {
        const triplet = `${process.platform}_${process.arch}`;
        const nativePackage = `@koromix/koffi-${process.platform}-${process.arch}`;
        const binary = path.join(path.dirname(createRequire(import.meta.url).resolve(`${nativePackage}/package.json`)), triplet, 'koffi.node');
        this.emitFile({ type: 'asset', fileName: `koffi/${triplet}/koffi.node`, source: readFileSync(binary) });
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
        plugins: preload ? [] : [appManifest(), koffiNative()],
        build: {
            ssr: true,
            target: 'node24',
            outDir: 'build',
            emptyOutDir: false,
            sourcemap: false,
            minify: false,
            rollupOptions: {
                input: preload
                    ? { preload: 'src/electron/preload.ts' }
                    : { index: 'src/electron/index.ts', pkcs11Host: 'src/electron/pkcs11/host.ts' },
                external: ['electron'],
                output: preload
                    ? { format: 'cjs', entryFileNames: 'electron/[name].cjs' }
                    : { format: 'es', entryFileNames: 'electron/[name].js', chunkFileNames: 'electron/[name]-[hash].js' }
            }
        }
    };
});
