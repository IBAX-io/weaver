/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { lazy, Suspense } from 'react';
import type { IMapViewProps } from './ArcGISMapView';

export type { IMapViewProps, TMapClickEvent } from './ArcGISMapView';

// @arcgis/core is large; it is only fetched when a map is actually shown
const ArcGISMapView = lazy(() => import('./ArcGISMapView'));

const MapView: React.FC<IMapViewProps> = props => (
    <Suspense fallback={<div className="map-loading" style={{ height: props.height }} />}>
        <ArcGISMapView {...props} />
    </Suspense>
);

export default MapView;
