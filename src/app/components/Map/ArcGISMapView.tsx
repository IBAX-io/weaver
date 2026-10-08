/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import '@arcgis/core/assets/esri/themes/light/main.css';
import './arcgisConfig';

import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import { TMapEditorType, TMapType } from 'ibax/geo';
import EsriMap from '@arcgis/core/Map.js';
import EsriMapView from '@arcgis/core/views/MapView.js';
import PolygonGeometry from '@arcgis/core/geometry/Polygon.js';
import * as geodeticAreaOperator from '@arcgis/core/geometry/operators/geodeticAreaOperator.js';
import { ClickEvent } from '@arcgis/core/views/input/types.js';

import { resolveBasemap } from './basemaps';
import Line from './Line';
import Polygon from './Polygon';
import Point from './Point';

export type TMapClickEvent = ClickEvent;

export interface IMapViewProps {
    height: number;
    tool: TMapEditorType;
    mapType?: TMapType;
    coords?: [number, number][];
    center?: [number, number];
    zoom?: number;
    onClick?: (e: TMapClickEvent) => void;
    onAreaChange?: (area: number) => void;
}

const DEFAULT_CENTER: [number, number] = [36.07574221562708, 5.0921630859375];

const centerChanged = (previous: [number, number] | undefined, next: [number, number] | undefined) =>
    !!next && (!previous || previous[0] !== next[0] || previous[1] !== next[1]);

const calcArea = async (tool: TMapEditorType, coords: [number, number][] | undefined) => {
    if ('polygon' !== tool || !coords || !coords.length) {
        return 0;
    }

    if (!geodeticAreaOperator.isLoaded()) {
        await geodeticAreaOperator.load();
    }

    const polygon = new PolygonGeometry({ rings: [coords] });
    return Math.abs(geodeticAreaOperator.execute(polygon, { unit: 'square-meters' }));
};

const MapView: React.FC<IMapViewProps> = props => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<EsriMapView | null>(null);
    const propsRef = useRef(props);
    propsRef.current = props;

    useEffect(() => {
        const initial = propsRef.current;
        const mapView = new EsriMapView({
            container: containerRef.current,
            map: new EsriMap({ basemap: resolveBasemap(initial.mapType) }),
            zoom: initial.zoom || 1,
            center: initial.center || DEFAULT_CENTER
        });

        const clickHandle = mapView.on('click', event => {
            propsRef.current.onClick?.(event);
        });

        mapView.when(() => {
            const { coords } = propsRef.current;
            if (coords && coords.length) {
                mapView.goTo(new PolygonGeometry({ rings: [coords] }), { animate: false }).catch(() => {
                    /* An interrupted or impossible navigation keeps the initial viewpoint */
                });
            }
        }, () => {
            /* View failed to load (e.g. no WebGL); nothing to position */
        });

        setView(mapView);

        return () => {
            clickHandle.remove();
            setView(null);
            mapView.map?.destroy();
            mapView.destroy();
        };
    }, []);

    useEffect(() => {
        if (view) {
            view.map.basemap = resolveBasemap(props.mapType);
        }
    }, [view, props.mapType]);

    const previousCenter = useRef(props.center);
    useEffect(() => {
        const previous = previousCenter.current;
        previousCenter.current = props.center;
        if (view && centerChanged(previous, props.center)) {
            view.zoom = 10;
            view.goTo(props.center).catch(() => {
                /* An interrupted navigation keeps the current viewpoint */
            });
        }
    }, [view, props.center]);

    const previousCoords = useRef<[number, number][] | undefined>(undefined);
    const areaInitialized = useRef(false);
    const areaRequest = useRef(0);
    useEffect(() => {
        if (areaInitialized.current && _.isEqual(previousCoords.current, props.coords)) {
            return;
        }
        areaInitialized.current = true;
        previousCoords.current = props.coords;

        const onAreaChange = propsRef.current.onAreaChange;
        if (!onAreaChange) {
            return;
        }

        const request = ++areaRequest.current;
        calcArea(props.tool, props.coords).then(area => {
            if (request === areaRequest.current) {
                onAreaChange(area);
            }
        }).catch(() => {
            /* Geometry engine failed to load: the previous area stays displayed */
        });
    }, [props.coords, props.tool]);

    const isEmpty = !props.coords || !props.coords.length;
    return (
        <div style={{ height: props.height }}>
            <div ref={containerRef} style={{ height: '100%' }} />
            {view && !isEmpty && 'point' === props.tool && (<Point view={view} coords={props.coords[0]} />)}
            {view && !isEmpty && 'line' === props.tool && (<Line view={view} coords={props.coords} />)}
            {view && !isEmpty && 'polygon' === props.tool && (<Polygon view={view} rings={props.coords} />)}
        </div>
    );
};

export default MapView;
