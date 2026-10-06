/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect } from 'react';
import Graphic, { GraphicProperties } from '@arcgis/core/Graphic.js';
import type EsriMapView from '@arcgis/core/views/MapView.js';

/** Keeps one graphic in the view's graphics layer while the owning component is mounted. */
const useViewGraphic = (view: EsriMapView, properties: GraphicProperties) => {
    useEffect(() => {
        const graphic = new Graphic(properties);
        view.graphics.add(graphic);
        return () => {
            view.graphics.remove(graphic);
        };
    }, [view, properties]);
};

export default useViewGraphic;
