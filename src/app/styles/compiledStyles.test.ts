/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The app stylesheet as the build compiles it (vite.config.ts loadPaths), checked for rules the
// Bootstrap 5 upgrade lost once already: each loss left controls unreadable or blank.
import { beforeAll, describe, it, expect } from 'vitest';
import { compile } from 'sass';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STYLES = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(STYLES, '../../..');

let css: string;
beforeAll(() => {
    css = compile(path.join(STYLES, 'scss/sass.scss'), {
        loadPaths: [path.join(STYLES, 'scss'), path.join(ROOT, 'node_modules')],
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        style: 'compressed'
    }).css;
}, 60000);

// The declarations of every rule whose selector list includes `selector`, in order
const declarations = (selector: string) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].split(',').map(s => s.trim()).includes(selector))
    .map(match => match[2])
    .join(';');

describe('compiled app styles', () => {
    it('writes default buttons white on the dark green (template .btn-default, IDE .btn-secondary)', () => {
        for (const selector of ['.btn-default', '.btn.btn-secondary']) {
            // Custom properties keep the space after the colon
            const rule = (declarations(selector) + ';' + declarations(`.protypo-content ${selector}`)).replace(/:\s+/g, ':');
            expect([selector, rule]).toEqual([selector, expect.stringContaining('--bs-btn-color:#fff;')]);
            expect(rule).toContain('--bs-btn-bg:#244134;');
            expect(rule).toContain('--bs-btn-disabled-color:#fff;');
        }
    });

    it('lets buttons and fields take the text color around them', () => {
        expect(declarations('button')).toContain('color:inherit');
        expect(declarations('input')).toContain('color:inherit');
    });

    it('keeps the icon font on buttons that carry an icon class', () => {
        expect(declarations('.btn.fa')).toContain('font-family:FontAwesome');
        expect(declarations('.btn[class*=" icon-"]')).toContain('simple-line-icons');
    });
});
