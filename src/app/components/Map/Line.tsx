/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { loadModules } from 'react-arcgis';

export interface ILineProps {
    view?: __esri.MapView;
    coords: [number, number][];
}

class Line extends React.Component<ILineProps> {
    private _graphic: __esri.Graphic = null;

    render() {
        return null as JSX.Element;
    }

    componentWillReceiveProps(props: ILineProps) {
        this.redraw(props.coords);
    }

    componentWillMount() {
        this.redraw(this.props.coords);
    }

    componentWillUnmount() {
        this.props.view.graphics.remove(this._graphic);
    }

    redraw(coords: [number, number][]) {
        loadModules(['esri/Graphic']).then((deps: [__esri.GraphicConstructor]) => {
            const [Graphic] = deps;

            const polyline = {
                type: 'polyline',
                paths: [...coords]
            };

            const fillSymbol = {
                type: 'simple-fill',
                color: [227, 139, 79, 0],
                outline: {
                    color: [0, 0, 0],
                    width: 1
                }
            };

            const graphic = new Graphic({
                geometry: polyline as any,
                symbol: fillSymbol
            });

            this._graphic = graphic;
            this.props.view.graphics.add(graphic);
        }).catch((err) => { /* Silently suppress errors */ });
    }
}

export default Line;