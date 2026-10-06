/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// An SVG used as an image is parsed as strict XML: one XML error (e.g. an undeclared xlink
// prefix) and the browser draws nothing, without any error. The macOS window controls were
// invisible because of exactly that.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SVG_DIRS = ['src/app', 'public'];

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full) : entry.name.endsWith('.svg') ? [full] : [];
    });

export const svgError = (source: string) => {
    const document = new DOMParser().parseFromString(source, 'image/svg+xml');
    const error = document.getElementsByTagName('parsererror')[0];
    return error ? error.textContent.trim().split('\n')[0] : null;
};

describe('SVG assets', () => {
    it('detects an SVG the browser would not draw (positive control)', () => {
        expect(svgError('<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#a"/></svg>')).not.toBeNull();
    });

    it('accepts a well-formed SVG (negative control)', () => {
        expect(svgError('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#a"/></svg>')).toBeNull();
    });

    it('every SVG asset is well-formed XML', () => {
        const files = SVG_DIRS.flatMap(dir => walk(path.join(REPO_ROOT, dir)));
        expect(files.length).toBeGreaterThan(0);
        const broken = files
            .map(file => ({ file: path.relative(REPO_ROOT, file), error: svgError(fs.readFileSync(file, 'utf8')) }))
            .filter(result => result.error);
        expect(broken).toEqual([]);
    });
});
