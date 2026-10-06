/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { TMapType } from 'ibax/geo';
import Basemap from '@arcgis/core/Basemap.js';
import TileLayer from '@arcgis/core/layers/TileLayer.js';

import { resolveBasemap } from './basemaps';

const LEGACY_MAP_TYPES: TMapType[] = ['streets', 'satellite', 'hybrid', 'topo', 'gray', 'dark-gray', 'oceans', 'terrain', 'osm'];

describe('resolveBasemap', () => {
    it.each(LEGACY_MAP_TYPES)('maps "%s" to a built-in keyless basemap id', mapType => {
        const basemap = resolveBasemap(mapType);
        expect(basemap).toBe(mapType);
        const resolved = Basemap.fromId(mapType);
        expect(resolved).toBeInstanceOf(Basemap);
        expect(resolved.style).toBeFalsy();
    });

    it('builds a tiled basemap for "national-geographic", which has no built-in id', () => {
        expect(Basemap.fromId('national-geographic')).toBeFalsy();
        const basemap = resolveBasemap('national-geographic');
        expect(basemap).toBeInstanceOf(Basemap);
        const layer = (basemap as Basemap).baseLayers.getItemAt(0);
        expect(layer).toBeInstanceOf(TileLayer);
        expect((layer as TileLayer).url).toBe('https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer');
    });

    it('falls back to streets when no map type is given', () => {
        expect(resolveBasemap(undefined)).toBe('streets');
    });
});
