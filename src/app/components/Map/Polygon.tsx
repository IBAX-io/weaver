/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import type EsriMapView from '@arcgis/core/views/MapView.js';

import useViewGraphic from './useViewGraphic';

export interface IPolygonProps {
    view: EsriMapView;
    rings: [number, number][];
}

const Polygon: React.FC<IPolygonProps> = ({ view, rings }) => {
    const properties = useMemo(() => ({
        geometry: {
            type: 'polygon' as const,
            rings: [[...rings]]
        },
        symbol: {
            type: 'simple-fill' as const,
            color: [227, 139, 79, 0.8],
            outline: {
                color: [255, 255, 255],
                width: 1
            }
        }
    }), [rings]);

    useViewGraphic(view, properties);
    return null;
};

export default Polygon;
