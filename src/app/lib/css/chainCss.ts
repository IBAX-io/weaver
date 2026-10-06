/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { compile, Element, serialize, stringify } from 'stylis';

// CSS that comes from the chain: a page template's .Style(...) and an ecosystem's stylesheet.
// Anyone who can edit them writes it, so it is accepted only when it can do no more than style
// its own part of the page. It is compiled the way styled-components compiles it (stylis) inside a
// placeholder scope, and refused as a whole when:
//  - a selector does not start at the scope, or reaches past it: "*:not(&)", ":is(&, .modal)",
//    "html:has(&) …" and sibling combinators ("& ~ …", "& + …") style the rest of the app;
//  - an at-rule other than @media, @supports, @container, @page or @keyframes appears (@import loads,
//    @scope and @layer change what selectors reach);
//  - anything makes the browser load a resource: with attribute selectors that leaks what is
//    typed into inputs (input[value^="a"] { background: url(…) });
//  - escapes or comments could hide any of this from the checks;
//  - the result could lie over the app's chrome (header 8000, modals 9000) and fake a
//    confirmation: z-index above 999, or position: fixed, which escapes the page's scrolling area.

const PLACEHOLDER = '.__weaver-scope';
const MAX_Z_INDEX = 999;
// @page holds only declarations (print margins and size)
const AT_RULES = ['@media', '@supports', '@container', '@page'];

const FORBIDDEN_SOURCE = [/\\/, /\/\*/, /</];

const FORBIDDEN_VALUE = [
    /\burl\s*\(/i,
    /image(-set)?\s*\(/i,
    /\bsrc\s*\(/i,
    /\bexpression\s*\(/i,
    /\belement\s*\(/i,
    /\bpaint\s*\(/i,
    /-moz-binding/i
];

// The selector with everything inside parentheses and strings removed, so what is left is its
// top level
const topLevel = (selector: string) => {
    let depth = 0;
    let quote: string | null = null;
    let result = '';
    for (const char of selector) {
        if (quote) {
            quote = char === quote ? null : quote;
        }
        else if ('"' === char || '\'' === char) {
            quote = char;
        }
        else if ('(' === char) {
            depth++;
        }
        else if (')' === char) {
            depth--;
        }
        else if (0 === depth) {
            result += char;
        }
    }
    return result;
};

// Starts at the scope, never names it again (that is how a selector reaches elsewhere), and goes
// only down from it
const selectorInScope = (selector: string) => selector.startsWith(PLACEHOLDER)
    && !/^[\w-]/.test(selector.slice(PLACEHOLDER.length))
    && 1 === selector.split(PLACEHOLDER).length - 1
    && !/[~+]/.test(topLevel(selector));

const declarationAllowed = (element: Element) => {
    const property = String(element.props).toLowerCase();
    const value = String(element.children);
    if (FORBIDDEN_VALUE.some(pattern => pattern.test(value)) || 'behavior' === property) {
        return false;
    }
    if ('z-index' === property) {
        return /^-?\d+$/.test(value.trim()) && Number(value) <= MAX_Z_INDEX;
    }
    if ('position' === property) {
        return !/\bfixed\b/i.test(value);
    }
    return true;
};

const elementsAllowed = (elements: Element[], inKeyframes = false): boolean => elements.every(element => {
    switch (element.type) {
        case 'decl':
            return declarationAllowed(element);
        case 'rule':
            return (inKeyframes || (element.props as string[]).every(selectorInScope))
                && elementsAllowed(element.children as Element[], inKeyframes);
        case 'comm':
            return true;
        case '@keyframes':
            return !inKeyframes && elementsAllowed(element.children as Element[], true);
        default:
            return AT_RULES.includes(element.type) && !inKeyframes && elementsAllowed(element.children as Element[]);
    }
});

// The compiled rules, or null when the CSS could reach outside its scope
const compileInScope = (css: unknown): Element[] | null => {
    if ('string' !== typeof css || FORBIDDEN_SOURCE.some(pattern => pattern.test(css))) {
        return null;
    }
    const elements = compile(`${PLACEHOLDER}{${css}}`);
    // Unbalanced braces close the scope early: what follows lands outside it, as its own rules
    return elementsAllowed(elements) ? elements : null;
};

// Styles are checked whenever their element renders: the same CSS gets the same answer, and a
// refusal is reported once
const CACHE_SIZE = 500;
const cache = new Map<string, string>();

const cached = (key: string, compute: () => string) => {
    let result = cache.get(key);
    if (undefined === result) {
        result = compute();
        if (cache.size >= CACHE_SIZE) {
            cache.delete(cache.keys().next().value);
        }
        cache.set(key, result);
    }
    return result;
};

// A page template element's .Style(...): returned unchanged for styled-components to scope to
// the element, or '' when refused
export const sanitizeTemplateStyle = (css: unknown): string => {
    if ('string' !== typeof css || !css.trim()) {
        return '';
    }
    return cached(`template\n${css}`, () => {
        if (!compileInScope(css)) {
            console.warn('Page template style refused: it could reach outside its element', css.slice(0, 200));
            return '';
        }
        return css;
    });
};

// An ecosystem's stylesheet (or its print stylesheet), scoped to the given selector (the area that
// shows its pages), or '' when refused
export const scopeChainStylesheet = (css: unknown, scope: string): string => {
    if ('string' !== typeof css || !css.trim()) {
        return '';
    }
    return cached(`${scope}\n${css}`, () => {
        const elements = compileInScope(css);
        if (!elements) {
            console.warn('Ecosystem stylesheet refused: it could reach outside its pages', css.slice(0, 200));
            return '';
        }
        return serialize(elements, stringify).split(PLACEHOLDER).join(scope);
    });
};
