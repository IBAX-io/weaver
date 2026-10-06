/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The page runs sandboxed with context isolation: `require`, `electron` and `@electron/remote` do
// not exist there, and a page that reaches for them only fails at runtime in the desktop app
// (the web build and tsc do not notice). Everything desktop-only goes through lib/desktop.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FORBIDDEN = [
    /\brequire\s*\(/,
    /\bfrom\s+['"](?:electron|@electron\/[^'"]+)['"]/,
    /\bimport\s*\(\s*['"](?:electron|@electron\/[^'"]+)['"]\s*\)/,
    /\bwindow\.require\b/,
    /\bprocess\.(?:platform|versions|env)\b/
];

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walk(full);
        }
        return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
    });

export const findDesktopLeaks = (source: string) =>
    source.split('\n').filter(line => !/^\s*(\/\/|\*)/.test(line) && FORBIDDEN.some(pattern => pattern.test(line)));

describe('desktop boundary', () => {
    it('detects Node and Electron access (positive control)', () => {
        // Lines that shipped before the bridge
        expect(findDesktopLeaks("const electron = require('electron');")).toHaveLength(1);
        expect(findDesktopLeaks("import * as remote from '@electron/remote';")).toHaveLength(1);
        expect(findDesktopLeaks("const DarwinTitlebar = require('./DarwinTitlebar').default;")).toHaveLength(1);
        expect(findDesktopLeaks("    os = process.platform;")).toHaveLength(1);
    });

    it('allows the bridge and comments (negative control)', () => {
        expect(findDesktopLeaks("import desktop from 'lib/desktop';\nif (desktop) { desktop.setBadgeCount(1); }")).toEqual([]);
        expect(findDesktopLeaks("// require('electron') is not available here")).toEqual([]);
        expect(findDesktopLeaks("const required = requireAll(list);")).toEqual([]);
    });

    it('src/app reaches the desktop only through lib/desktop', () => {
        const offenders = walk(SRC_ROOT)
            .map(file => ({ file: path.relative(SRC_ROOT, file), lines: findDesktopLeaks(fs.readFileSync(file, 'utf8')) }))
            .filter(result => result.lines.length);
        expect(offenders).toEqual([]);
    });
});
