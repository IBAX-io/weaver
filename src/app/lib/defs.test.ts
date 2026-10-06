/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The declarations in src/defs are shared with the Electron build (tsconfig.electron.json). An
// import of app code from here drags that code into the Electron compile, which then fails
// (rootDir) or writes compiled .js next to the app sources.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../defs');

export const appImports = (source: string) =>
    [...source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)]
        .map(match => match[1])
        .filter(specifier => !specifier.startsWith('ibax/'));

describe('src/defs', () => {
    it('detects imports of app code (positive control)', () => {
        expect(appImports(`import { A } from 'modules/router/types';\n  x: import('lib/crypto/suites').B;`))
            .toEqual(['modules/router/types', 'lib/crypto/suites']);
    });

    it('allows declarations from other ibax modules (negative control)', () => {
        expect(appImports(`import { A } from 'ibax/router';\n  x: import('ibax/crypto').B;`)).toEqual([]);
    });

    it('declarations only depend on other declarations', () => {
        const offenders = fs.readdirSync(DEFS_DIR)
            .filter(file => file.endsWith('.d.ts'))
            .map(file => ({ file, imports: appImports(fs.readFileSync(path.join(DEFS_DIR, file), 'utf8')) }))
            .filter(result => result.imports.length);
        expect(offenders).toEqual([]);
    });
});
