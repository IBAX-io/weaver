/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..');

const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? sources(join(dir, entry.name))
    : /\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []);

// Names of what a file uses that is exported for tests only (such as SM2 signing with a given
// nonce: two signatures with one nonce give the key away)
const testOnlyUses = (text: string) => [...text.matchAll(/\b(\w+ForTest)\b/g)].map(match => match[1]);

describe('exports for tests only', () => {
    it('are used by tests only', () => {
        const files = sources(SRC);
        expect(files.length).toBeGreaterThan(100);
        const misuses = files
            .filter(file => !/\.test\.tsx?$/.test(file))
            .flatMap(file => {
                const text = readFileSync(file, 'utf8');
                // Its own export is not a use
                const used = testOnlyUses(text.replace(/export const \w+ForTest\b/g, ''));
                return used.map(name => `${file.slice(SRC.length + 1)}: ${name}`);
            });
        expect(misuses).toEqual([]);
    });

    it('a use outside a test is caught (positive control)', () => {
        expect(testOnlyUses("import { sm2SignWithNonceForTest } from 'lib/crypto/sm';")).toEqual(['sm2SignWithNonceForTest']);
        expect(testOnlyUses('export const sm2SignWithNonceForTest = signWith;'.replace(/export const \w+ForTest\b/g, ''))).toEqual([]);
    });
});
