/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useMemo } from 'react';
import type EsriMapView from '@arcgis/core/views/MapView.js';

import useViewGraphic from './useViewGraphic';

export interface ILineProps {
    view: EsriMapView;
    coords: [number, number][];
}

const Line: React.FC<ILineProps> = ({ view, coords }) => {
    const properties = useMemo(() => ({
        geometry: {
            type: 'polyline' as const,
            paths: [[...coords]]
        },
        symbol: {
            type: 'simple-line' as const,
            color: [0, 0, 0],
            width: 1
        }
    }), [coords]);

    useViewGraphic(view, properties);
    return null;
};

export default Line;
