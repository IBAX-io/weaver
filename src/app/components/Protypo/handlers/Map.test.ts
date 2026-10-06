/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';

vi.mock('components/Map/MapView', () => ({ default: () => null }));
const { parseData } = await import('./Map');

describe('protypo Map value', () => {
    it('reads the template center {lat, lng} in the app\'s [longitude, latitude] order', () => {
        const value = parseData(JSON.stringify({ type: 'point', coords: [[13.4, 52.5]], center: { lat: 52.5, lng: 13.4 }, zoom: 10 }));

        expect(value.center).toEqual([13.4, 52.5]);
        expect(value.center).toEqual(value.coords[0]);
    });

    it('ignores malformed values', () => {
        expect(parseData('not json')).toEqual({ type: 'point', coords: [], area: 0, address: '' });
    });
});
