/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { TMapType } from 'ibax/geo';
import { IMapValue, parseData } from 'components/Protypo/handlers/Map';

import Validation from 'components/Validation';

export interface IInputMapProps {
    name: string;
    value: string;
    maptype: TMapType;
}

const InputMap: React.SFC<IInputMapProps> = (props) => {
    const value: IMapValue = parseData(props.value) || {
        type: 'point',
        coords: [],
        area: 0,
        address: ''
    };

    return (
        <Validation.components.ValidatedMap
            name={props.name}
            value={value}
            zoom={value.zoom}
            center={value.center}
            type={value.type}
            mapType={props.maptype}
        />
    );
};

export default InputMap;