/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { generateRoute, matchRoute } from '.';

describe('router service', () => {
    it('matches a page with its parameters', () => {
        expect(matchRoute('/browse(/:section)(/:page)', '/browse/home/default_page?open=page&name=main')).toEqual({
            parts: { section: 'home', page: 'default_page' },
            query: { open: 'page', name: 'main' }
        });
        expect(matchRoute('/browse(/:section)(/:page)', '/editor')).toBeUndefined();
    });

    it('gives every parameter a single string value', () => {
        // Values end up as editor tab types and page params, which take one string
        expect(matchRoute('/browse(/:section)', '/browse/home?open=page&open=contract&flag').query).toEqual({ open: 'page', flag: '' });
    });

    it('generates links with their parameters', () => {
        expect(generateRoute('/browse/home/main', { b: '2', a: 'x y' })).toBe('/browse/home/main?a=x%20y&b=2');
        expect(generateRoute('/browse/home/main')).toBe('/browse/home/main');
    });
});
