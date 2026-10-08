/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// styled-components 6 (stylis v4) silently drops malformed declarations that the old parser
// tolerated (e.g. `padding 0 10px;`), so broken CSS shows up only as a visual regression.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MISSING_COLON = /^\s*[a-z-]+\s+[^:;{}()]+;\s*$/;
const TRAILING_COMMA = /^\s*[a-z-]+\s*:[^;{}]*,\s*$/;
const MISSING_PROPERTY = /\{\s*-?\d/;

export const findMalformedCss = (source: string) => {
    const problems: string[] = [];
    const templates = /(?:styled|themed)(?:\.[a-zA-Z]+|\([^)]*\))(?:\.attrs\([^`]*?\))?`([\s\S]*?)`|keyframes`([\s\S]*?)`/g;
    let match: RegExpExecArray | null;
    while ((match = templates.exec(source))) {
        for (const raw of (match[1] ?? match[2]).split('\n')) {
            const line = raw.split('//')[0];
            if (line.includes('${')) {
                continue;
            }
            if (MISSING_COLON.test(line) || TRAILING_COMMA.test(line) || MISSING_PROPERTY.test(line)) {
                problems.push(raw.trim());
            }
        }
    }
    return problems;
};

const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
});

describe('styled-components CSS', () => {
    it('detects malformed declarations (positive control)', () => {
        expect(findMalformedCss('const A = styled.ul`\n    padding 0 10px;\n`;')).toEqual(['padding 0 10px;']);
        expect(findMalformedCss('const B = themed.div`\n    color: #5b97e4,\n    margin: 0;\n`;')).toEqual(['color: #5b97e4,']);
        expect(findMalformedCss('const k = keyframes`\n  to {-10px;opacity:1;}\n`;')).toEqual(['to {-10px;opacity:1;}']);
    });

    it('accepts valid CSS (negative control)', () => {
        expect(findMalformedCss('const A = styled.div`\n    padding: 0 10px;\n    transition: color .15s, opacity .2s;\n    &:hover { color: red; }\n    font-family: a, b;\n`;')).toEqual([]);
    });

    it('has no malformed declarations in the app', () => {
        const offenders = walk(SRC_ROOT)
            .map(file => ({ file: path.relative(SRC_ROOT, file), problems: findMalformedCss(fs.readFileSync(file, 'utf8')) }))
            .filter(result => result.problems.length);
        expect(offenders).toEqual([]);
    });
});
