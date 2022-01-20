/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { TMapType, IMapEditorEvent } from 'ibax/geo';

import MapView from 'components/Map/MapView';

export interface IMapProps {
    value: string;
    maptype: TMapType;
    hmap: string;
}

export interface IMapValue extends IMapEditorEvent {
    zoom?: number;
    center?: [number, number];
}

const mapTypes = ['point', 'line', 'polygon'];

export const parseData = (plain: string): IMapValue => {
    const result: IMapValue = {
        type: 'point',
        coords: [],
        area: 0,
        address: ''
    };

    try {
        const value = JSON.parse(plain);
        if (Array.isArray(value.coords)) {
            value.coords.forEach((l: any) => {
                if (Array.isArray(l)) {
                    if ('number' === typeof l[0] && 'number' === typeof l[1]) {
                        result.coords.push([l[0], l[1]]);
                    }
                }
            });
        }

        if (mapTypes.includes(value.type)) {
            result.type = value.type;
        }

        if (value.center) {
            if ('number' === typeof value.center.lng && 'number' === typeof value.center.lat) {
                result.center = [value.center.lat, value.center.lng];
            }
        }

        if ('number' === typeof value.area) {
            result.area = value.area;
        }

        if ('number' === typeof value.zoom) {
            result.zoom = value.zoom;
        }

        if ('string' === typeof value.address) {
            result.address = value.address;
        }

    }
    catch (e) {
        // Suppress errors silently
    }

    return result;
};

const InputMap: React.SFC<IMapProps> = (props) => {
    const value: IMapValue = parseData(props.value) || {
        type: 'point',
        coords: [],
        area: 0,
        address: ''
    };

    let height = parseInt(props.hmap, 10);
    if (!height) {
        height = 100;
    }

    return (
        <MapView
            tool={value.type}
            height={height}
            mapType={props.maptype}
            coords={value.coords}
            center={value.center}
            zoom={value.zoom}
        />
    );
};

export default InputMap;