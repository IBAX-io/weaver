/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TMapType } from 'ibax/geo';
import Basemap from '@arcgis/core/Basemap.js';
import TileLayer from '@arcgis/core/layers/TileLayer.js';

/*
 * `maptype` values are part of the protypo page contract (on-chain templates pass them), so the
 * names stay those of ArcGIS JS 4.8. Each one is mapped to a basemap of @arcgis/core 5.x that loads
 * without an API key:
 *
 * | maptype              | @arcgis/core 5.x basemap                                                   |
 * |----------------------|----------------------------------------------------------------------------|
 * | streets              | `streets` (World Street Map, vector)                                       |
 * | satellite            | `satellite` (World Imagery)                                                |
 * | hybrid               | `hybrid` (World Imagery + Hybrid Reference)                                |
 * | topo                 | `topo` (World Hillshade + World Topographic Map, vector)                   |
 * | gray                 | `gray` (Light Gray Canvas, vector)                                         |
 * | dark-gray            | `dark-gray` (Dark Gray Canvas, vector)                                     |
 * | oceans               | `oceans` (World Ocean Base + World Ocean Reference)                        |
 * | national-geographic  | no built-in id in 5.x: custom Basemap over the NatGeo_World_Map tile service |
 * | terrain              | `terrain` (World Hillshade + World Terrain Base + World Reference)         |
 * | osm                  | `osm` (OpenStreetMapLayer)                                                 |
 *
 * The `{provider}/{style}` ids of the Basemap Styles service (e.g. `arcgis/topographic`) are not used:
 * they require `esriConfig.apiKey`.
 */

const NATIONAL_GEOGRAPHIC_TILES = 'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer';

const createNationalGeographic = () => new Basemap({
    id: 'national-geographic',
    title: 'National Geographic',
    baseLayers: [new TileLayer({ url: NATIONAL_GEOGRAPHIC_TILES })]
});

const basemapTable: { readonly [K in TMapType]: string | (() => Basemap) } = {
    'streets': 'streets',
    'satellite': 'satellite',
    'hybrid': 'hybrid',
    'topo': 'topo',
    'gray': 'gray',
    'dark-gray': 'dark-gray',
    'oceans': 'oceans',
    'national-geographic': createNationalGeographic,
    'terrain': 'terrain',
    'osm': 'osm'
};

export const DEFAULT_MAP_TYPE: TMapType = 'streets';

export const resolveBasemap = (mapType: TMapType | undefined): string | Basemap => {
    const entry = basemapTable[mapType] ?? basemapTable[DEFAULT_MAP_TYPE];
    return 'string' === typeof entry ? entry : entry();
};
