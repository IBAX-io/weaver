/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
// Electron >= 14 removed the built-in `remote` module. `require('electron')` is untyped (any),
// so tsc cannot catch `.remote` access; this test does. Use `@electron/remote` instead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_ROOT = path.resolve(__dirname, '..');
const LEGACY_REMOTE = /require\(\s*['"]electron['"]\s*\)\s*\.remote\b|\b[Ee]lectron\.remote\b/;

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry: any) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walk(full);
        }
        return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
    });

export const findLegacyRemote = (source: string) =>
    source.split('\n').filter(line => LEGACY_REMOTE.test(line));

describe('electron remote usage', () => {
    it('detects legacy remote access (positive control)', () => {
        // The exact line that shipped in subscribeEpic before the Electron 22 upgrade fix.
        // Blind spot: an arbitrary alias (`const E = require('electron'); E.remote`) is not detected.
        expect(findLegacyRemote('Electron.remote.app.setBadgeCount(count);')).toHaveLength(1);
        expect(findLegacyRemote("require('electron').remote.getCurrentWindow()")).toHaveLength(1);
    });

    it('ignores @electron/remote (negative control)', () => {
        expect(findLegacyRemote("const remote = require('@electron/remote');\nremote.app.setBadgeCount(1);")).toHaveLength(0);
    });

    it('has no legacy electron.remote access in src/app', () => {
        const offenders = walk(SRC_ROOT)
            .map(file => ({ file, lines: findLegacyRemote(fs.readFileSync(file, 'utf8')) }))
            .filter(result => result.lines.length > 0);
        expect(offenders).toEqual([]);
    });
});
