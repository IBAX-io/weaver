/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IAddressSuggestion } from './AddressCombobox';

const WORLD_GEOCODER = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';

// Loaded on first use so @arcgis/core stays out of the main bundle
const loadArcGIS = async () => {
    await import('./arcgisConfig');
    const [locator, { default: Polygon }] = await Promise.all([
        import('@arcgis/core/rest/locator.js'),
        import('@arcgis/core/geometry/Polygon.js')
    ]);
    return { locator, Polygon };
};

// Address of the shape's centroid; empty when there is none or the geocoder is unavailable
export const addressOfShape = async (coords: [number, number][]): Promise<string> => {
    try {
        const { locator, Polygon } = await loadArcGIS();
        const centroid = new Polygon({ rings: [coords] }).centroid;
        if (!centroid) {
            return '';
        }
        const result = await locator.locationToAddress(WORLD_GEOCODER, { location: centroid });
        return result.address || '';
    }
    catch (e) {
        return '';
    }
};

export const searchAddress = async (value: string): Promise<IAddressSuggestion[]> => {
    const { locator } = await loadArcGIS();
    const result = await locator.addressToLocations(WORLD_GEOCODER, {
        address: { SingleLine: value },
        maxLocations: 5
    });
    return result
        .filter(l => l.location)
        .map(l => ({
            address: l.address || '',
            location: [l.location.longitude, l.location.latitude] as [number, number]
        }));
};
