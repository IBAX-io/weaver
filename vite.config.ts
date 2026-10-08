/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFileSync, cpSync, createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
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

// @arcgis/core loads workers, wasm and locale files at runtime from `esriConfig.assetsPath`
// (components/Map/arcgisConfig.ts points it at /arcgis-assets). Serve and ship them locally so
// the app never pulls code from js.arcgis.com.
const ARCGIS_ASSETS_URL = '/arcgis-assets/';
const arcgisAssetsDir = fileURLToPath(new URL('./node_modules/@arcgis/core/assets', import.meta.url));
const ARCGIS_MIME: { [ext: string]: string } = {
    '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
    '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};

const arcgisAssets = (): Plugin => {
    let outDir = 'build';
    return {
        name: 'weaver-arcgis-assets',
        configResolved(config) {
            outDir = config.build.outDir;
        },
        configureServer(server) {
            server.middlewares.use(ARCGIS_ASSETS_URL, (req, res, next) => {
                const relative = decodeURIComponent((req.url || '').split('?')[0]);
                const file = path.join(arcgisAssetsDir, relative);
                if (!file.startsWith(arcgisAssetsDir + path.sep) || !existsSync(file) || !statSync(file).isFile()) {
                    return next();
                }
                res.setHeader('Content-Type', ARCGIS_MIME[path.extname(file)] || 'application/octet-stream');
                createReadStream(file).pipe(res);
            });
        },
        writeBundle() {
            cpSync(arcgisAssetsDir, path.join(outDir, ARCGIS_ASSETS_URL), { recursive: true });
        }
    };
};

// What the built page may load and run. Pages and stylesheets come from the chain, so whatever slips
// past the app's own checks still cannot run script, load fonts, post forms or embed plugins.
// Images and connections stay open: templates show images from anywhere, and the app talks to any
// node the user adds. The page's own inline script (the SPA redirect in index.html) is allowed by
// its hash. Not applied to the dev server, whose module reloading injects inline scripts.
const contentSecurityPolicy = (): Plugin => ({
    name: 'weaver-csp',
    apply: 'build',
    transformIndexHtml: {
        order: 'post',
        handler(html) {
            const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
                .map(match => `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
            const policy = [
                "default-src 'self'",
                // wasm-unsafe-eval: ArcGIS compiles WebAssembly (not JavaScript eval)
                `script-src 'self' 'wasm-unsafe-eval' ${inlineScripts.join(' ')}`,
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: http: https:",
                "media-src 'self' data: blob: http: https:",
                "font-src 'self' data:",
                "connect-src 'self' http: https: ws: wss:",
                "worker-src 'self' blob:",
                "frame-src 'self'",
                "object-src 'none'",
                "base-uri 'none'",
                "form-action 'none'"
            ].join('; ');
            return html.replace('<meta charset="utf-8" />', `<meta charset="utf-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
        }
    }
});

export default defineConfig(({ mode }) => ({
    // The desktop build is loaded from file://, so asset URLs must be relative
    base: mode === 'desktop' ? './' : '/',
    plugins: [react(), seedSettings(), arcgisAssets(), contentSecurityPolicy()],
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
                loadPaths: [`${appRoot}/styles/scss`, fileURLToPath(new URL('./node_modules', import.meta.url))],
                // Bootstrap's own SCSS still triggers Sass deprecations; ours must stay warning-free
                quietDeps: true
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
