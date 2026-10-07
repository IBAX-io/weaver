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
const warnings: string[] = [];
beforeAll(() => {
    // The options vite.config.ts gives Sass, nothing more: a warning here is one the build prints
    css = compile(path.join(STYLES, 'scss/sass.scss'), {
        loadPaths: [path.join(STYLES, 'scss'), path.join(ROOT, 'node_modules')],
        quietDeps: true,
        style: 'compressed',
        logger: { warn: message => warnings.push(message) }
    }).css;
}, 60000);

// The selectors of a selector list: split at its own commas, not those inside :is(…) or :not(…)
const selectorList = (list: string) => {
    const selectors = [''];
    let depth = 0;
    for (const char of list) {
        depth += '(' === char ? 1 : ')' === char ? -1 : 0;
        if (',' === char && 0 === depth) {
            selectors.push('');
        }
        else {
            selectors[selectors.length - 1] += char;
        }
    }
    return selectors.map(selector => selector.trim());
};

// The declarations of every rule whose selector list includes `selector`, in order
const declarations = (selector: string) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => selectorList(match[1]).includes(selector))
    .map(match => match[2])
    .join(';');

// The same, without the spaces custom properties keep after a colon or comma
const flat = (selector: string) => declarations(selector).replace(/([:,])\s+/g, '$1');

describe('compiled app styles', () => {
    it('compiles without warnings', () => {
        expect(warnings).toEqual([]);
    });

    it('writes default buttons white on the dark green (template .btn-default, IDE .btn-secondary)', () => {
        for (const selector of ['.btn-default', '.btn.btn-secondary']) {
            const rule = flat(selector) + ';' + flat(`.protypo-content ${selector}`);
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
        expect(declarations('.btn[class^=icon-]')).toContain('simple-line-icons');
        expect(declarations('.btn[class*=" icon-"]')).toContain('simple-line-icons');
    });

    it('gives tables, fields and lists their Weaver 1.x look', () => {
        // Cells keep the background and text colour around them
        expect(flat('.table')).toContain('--bs-table-bg:transparent');
        expect(flat('.table')).toContain('--bs-table-color:currentcolor');
        expect(flat('.protypo-content .table>thead>tr>th')).toContain('color:#888');
        expect(flat('.protypo-content .table>tbody>tr>td')).toContain('vertical-align:middle');
        // White fields, not the page's grey; read-only ones grey in page templates
        expect(flat('.form-control')).toContain('background-color:#fff');
        expect(flat('.protypo-content .form-control[readonly]')).toContain('background-color:#edf1f2');
        // List items in templates, with or without a .list-group around them
        expect(flat('.protypo-content')).toContain('--bs-list-group-item-padding-x:15px');
    });

    it('keeps the designer tabs readable: dark text on the light tabs, white on the current one', () => {
        const tab = '.nav-tabs-dark.nav-justified>.nav-item>.nav-link';
        expect(flat(tab)).toContain('color:#1f2a36');
        expect(flat(tab)).toContain('background-color:#96a2b7');
        expect(flat(`${tab}:hover`)).toContain('background-color:#8e99ad');
        expect(flat(`${tab}:hover`)).toContain('color:#1f2a36');
        expect(flat(`${tab}.active`)).toContain('color:#fff');
        expect(flat(`${tab}.active`)).toContain('background-color:#3a4653');
        // Focus no longer greys the text out; the ring is drawn inside the tab
        expect(flat(`${tab}:focus`)).toBe('');
        expect(flat(`${tab}:focus-visible`)).toContain('outline-offset:-4px');
    });

    it('styles template buttons that leave out .btn, as Bootstrap 3 did', () => {
        const bare = (names: string[]) => names.map(name => `.protypo-content .btn-${name}:not(.btn)`);
        const variants = bare(['default', 'primary', 'success', 'info', 'warning', 'danger', 'link']);
        const sizes = bare(['xs', 'sm', 'lg']);

        // A variant class sets the colours, from the properties it defines, in every state
        expect(new Set(variants.map(flat)).size).toBe(1);
        expect(flat(variants[0])).toBe('color:var(--bs-btn-color);background-color:var(--bs-btn-bg);border-color:var(--bs-btn-border-color)');
        for (const [state, name] of [[':hover', 'hover'], [':active', 'active'], [':disabled', 'disabled'], ['.disabled', 'disabled']]) {
            for (const selector of variants) {
                expect([selector + state, flat(selector + state)]).toEqual([selector + state, expect.stringContaining(`background-color:var(--bs-btn-${name}-bg)`)]);
            }
        }
        expect(flat('.protypo-content .btn-link:not(.btn):is(:hover,:focus)')).toContain('text-decoration:underline');

        // A size class its padding, font and corners; neither touches the layout (no display, no
        // padding from a variant: the trash icons in table rows stay their size)
        expect(new Set(sizes.map(flat)).size).toBe(1);
        expect(flat(sizes[0])).toContain('padding:var(--bs-btn-padding-y) var(--bs-btn-padding-x)');
        expect(flat(sizes[0])).toContain('font-size:var(--bs-btn-font-size)');
        expect([...variants, ...sizes].map(flat).join(';')).not.toMatch(/display:|width:/);

        // The classes themselves still set the values: the default skin, the extra-small size
        expect(flat('.protypo-content .btn-default')).toContain('--bs-btn-bg:#244134');
        expect(flat('.protypo-content .btn-xs')).toContain('--bs-btn-font-size:12px');
        expect(flat('.protypo-content .btn-xs')).toContain('--bs-btn-line-height:1.5');
    });

    it('keeps a bg-* button its colour when hovered, pressed or disabled (the pager)', () => {
        for (const name of ['bg-gray-lighter', 'bg-green', 'bg-green-light', 'bg-primary-dark']) {
            // The class twice: above .protypo-content .btn-default and the theme's .btn.btn-secondary,
            // and it reaches buttons written without .btn too
            const selector = `.${name}.${name}:is(.btn,[class*=btn-])`;
            const rule = flat(selector);
            const bg = /--bs-btn-bg:([^;]+)/.exec(rule);
            expect([selector, bg]).not.toEqual([selector, null]);
            for (const state of ['hover', 'active', 'disabled']) {
                expect(rule).toContain(`--bs-btn-${state}-bg:${bg[1]}`);
            }
        }
        expect(flat('.bg-gray-lighter.bg-gray-lighter:is(.btn,[class*=btn-])')).toContain('--bs-btn-bg:#edf1f2');
    });

    it('rings the keyboard focus of a designer tab in the tab\'s own text colour', () => {
        expect(flat('.nav-tabs-dark.nav-justified>.nav-item>.nav-link:focus-visible')).toMatch(/outline-color:currentcolor ?!important/);
    });

    it('keeps template breadcrumbs a plain block under the title, items in one line', () => {
        const rule = flat('.protypo-content .breadcrumb');
        expect(rule).toContain('display:block');
        expect(rule).toContain('margin:0');
        expect(rule).toMatch(/background:(none|0 0)/);
        expect(flat('.protypo-content .breadcrumb>li')).toContain('display:inline-block');
        // Not the IDE's: Bootstrap 5's own breadcrumb stays as it is outside templates
        expect(declarations('.breadcrumb')).not.toContain('display:block');
    });
});
