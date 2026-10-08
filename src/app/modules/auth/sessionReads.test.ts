/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..', '..');

const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? sources(join(dir, entry.name))
    : /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []);

// Reading the session's network or token straight off the state: none once signed out, so what
// does it fails on an action that comes after (it ended every epic before signedInSession)
const directReads = (text: string) => [...text.matchAll(/\bauth\.session\.(?!prompt\b)\w+/g)].map(match => match[0]);

describe('the signed-in session', () => {
    it('is read through signedInSession only', () => {
        const files = sources(SRC);
        expect(files.length).toBeGreaterThan(100);
        const reads = files.flatMap(file => directReads(readFileSync(file, 'utf8')).map(read => `${file.slice(SRC.length + 1)}: ${read}`));
        expect(reads).toEqual([]);
    });

    it('a direct read is caught, a message id is not (controls)', () => {
        expect(directReads('apiHost: state.auth.session.network.apiHost')).toEqual(['auth.session.network']);
        expect(directReads('const session = state$.value.auth.session;')).toEqual([]);
        expect(directReads('<FormattedMessage id="auth.session.prompt" />')).toEqual([]);
    });
});
