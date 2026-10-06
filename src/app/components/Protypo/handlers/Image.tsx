/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';

import { ProtypoContext } from '../ProtypoContext';
import StyledComponent from './StyledComponent';

export interface IImageProps {
    'className'?: string;
    'class'?: string;
    'src'?: string;
    'alt'?: string;
}

const Image: React.FC<IImageProps> = props => {
    const context = useContext(ProtypoContext);
    return (
        <img className={[props.class, props.className].join(' ')} src={context.protypo.resolveData(props.src)} alt={props.alt} />
    );
};

export default StyledComponent(Image);