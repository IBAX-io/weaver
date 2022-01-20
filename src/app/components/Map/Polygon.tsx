/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { loadModules } from 'react-arcgis';

export interface IPolygonProps {
    view?: __esri.MapView;
    rings: [number, number][];
}

class Polygon extends React.Component<IPolygonProps> {
    private _graphic: __esri.Graphic = null;

    render() {
        return null as JSX.Element;
    }

    componentWillReceiveProps(props: IPolygonProps) {
        this.redraw(props.rings);
    }

    componentWillMount() {
        this.redraw(this.props.rings);
    }

    componentWillUnmount() {
        this.props.view.graphics.remove(this._graphic);
    }

    redraw(rings: [number, number][]) {
        loadModules(['esri/Graphic']).then((deps: [__esri.GraphicConstructor]) => {
            const [Graphic] = deps;

            const polygon = {
                type: 'polygon',
                rings: [...rings]
            };

            const fillSymbol = {
                type: 'simple-fill',
                color: [227, 139, 79, 0.8],
                outline: {
                    color: [255, 255, 255],
                    width: 1
                }
            };

            const graphic = new Graphic({
                geometry: polygon as any,
                symbol: fillSymbol
            });

            this._graphic = graphic;
            this.props.view.graphics.add(graphic);
        }).catch((err) => { /* Silently suppress errors */ });
    }
}

export default Polygon;