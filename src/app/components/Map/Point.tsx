/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import type EsriMapView from '@arcgis/core/views/MapView.js';

import useViewGraphic from './useViewGraphic';

export interface IPointProps {
    view: EsriMapView;
    coords: [number, number];
}

const Point: React.FC<IPointProps> = ({ view, coords }) => {
    const [longitude, latitude] = coords;
    const properties = useMemo(() => ({
        geometry: {
            type: 'point' as const,
            longitude,
            latitude
        },
        symbol: {
            type: 'simple-marker' as const,
            color: [226, 119, 40]
        }
    }), [longitude, latitude]);

    useViewGraphic(view, properties);
    return null;
};

export default Point;
