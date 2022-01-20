/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import _ from 'lodash';
import { TMapEditorType } from 'ibax/geo';
import { Map, loadModules } from 'react-arcgis';

import Line from './Line';
import Polygon from './Polygon';
import Point from './Point';

export interface IMapViewProps {
    height: number;
    tool: TMapEditorType;
    mapType?: 'streets' | 'satellite' | 'hybrid' | 'topo' | 'gray' | 'dark-gray' | 'oceans' | 'national-geographic' | 'terrain' | 'osm';
    coords?: [number, number][];
    center?: [number, number];
    zoom?: number;
    onClick?: (e: __esri.MapViewClickEvent) => void;
    onAreaChange?: (area: number) => void;
}

const comparePoints = (a: [number, number], b: [number, number]) => {
    if (!a && b) {
        return true;
    }
    else if (!b) {
        return false;
    }
    else if (a && b && (a[0] !== b[0] || a[1] !== b[1])) {
        return true;
    }
    else {
        return false;
    }
};

class MapView extends React.Component<IMapViewProps> {
    private _mapView: __esri.MapView = null;
    private _defaultCenter = [36.07574221562708, 5.0921630859375];

    componentDidMount() {
        this.processEvents(this.props);
    }

    componentWillReceiveProps(props: IMapViewProps) {
        if (this._mapView) {
            this._mapView.graphics.removeAll();
        }

        if (!_.isEqual(this.props.coords, props.coords)) {
            this.processEvents(props);
        }

        if (comparePoints(this.props.center, props.center)) {
            this._mapView.zoom = 10;
            this._mapView.goTo(props.center);
        }
    }

    onLoad = (map: __esri.Map, view: __esri.MapView) => {
        this._mapView = view;

        if (this.props.coords && this.props.coords.length) {
            loadModules(['esri/geometry/Polygon']).then((value: [__esri.PolygonConstructor]) => {
                const [PolygonGeometry] = value;
                const polygon = new PolygonGeometry({
                    rings: [
                        this.props.coords
                    ]
                });

                this._mapView.goTo(polygon, {
                    animate: false
                });

            }).catch(a => {/* Silently suppress errors*/ });
        }
    }

    processEvents(props: IMapViewProps) {
        if (props.onAreaChange) {
            if ('polygon' !== props.tool || !props.coords || !props.coords.length) {
                props.onAreaChange(0);
            }
            else {
                loadModules(['esri/geometry/geometryEngine', 'esri/geometry/Polygon']).then((value: [__esri.geometryEngine, __esri.PolygonConstructor]) => {
                    const [geometryEngine, PolygonGeometry] = value;
                    const polygon = new PolygonGeometry({
                        rings: [
                            props.coords
                        ]
                    });
                    const area = geometryEngine.geodesicArea(polygon, 'square-meters');
                    props.onAreaChange(Math.abs(area));
                }).catch(a => {/* Silently suppress errors*/ });
            }
        }
    }

    render() {
        const isEmpty = !this.props.coords || !this.props.coords.length;
        return (
            <div style={{ height: this.props.height }}>
                <Map
                    onLoad={this.onLoad}
                    mapProperties={{
                        basemap: this.props.mapType || 'streets'
                    }}
                    viewProperties={{
                        zoom: this.props.zoom || 1,
                        center: this.props.center || this._defaultCenter
                    }}
                    onClick={this.props.onClick}
                >
                    {!isEmpty && 'point' === this.props.tool ? (<Point coords={this.props.coords[0]} />) : <span />}
                    {!isEmpty && 'line' === this.props.tool ? (<Line coords={this.props.coords} />) : <span />}
                    {!isEmpty && 'polygon' === this.props.tool ? (<Polygon rings={this.props.coords} />) : <span />}
                </Map>
            </div>
        );
    }
}

export default MapView;