/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { loadModules } from 'react-arcgis';

export interface IPointProps {
    view?: __esri.MapView;
    coords: [number, number];
}

class Point extends React.Component<IPointProps> {
    private _graphic: __esri.Graphic = null;

    render() {
        return null as JSX.Element;
    }

    componentWillReceiveProps(props: IPointProps) {
        this.redraw(props.coords);
    }

    componentWillMount() {
        this.redraw(this.props.coords);
    }

    componentWillUnmount() {
        this.props.view.graphics.remove(this._graphic);
    }

    redraw(coords: [number, number]) {
        loadModules(['esri/Graphic']).then((deps: [__esri.GraphicConstructor]) => {
            const [Graphic] = deps;

            const point = {
                type: 'point',
                longitude: coords[0],
                latitude: coords[1]
            };

            const fillSymbol = {
                type: 'simple-marker',
                color: [226, 119, 40]
            };

            const graphic = new Graphic({
                geometry: point as any,
                symbol: fillSymbol
            });

            this._graphic = graphic;
            this.props.view.graphics.add(graphic);
        }).catch((err) => { /* Silently suppress errors */ });
    }
}

export default Point;