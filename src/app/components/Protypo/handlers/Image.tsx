/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as propTypes from 'prop-types';

import Protypo from '../Protypo';
import StyledComponent from './StyledComponent';

export interface IImageProps {
    'className'?: string;
    'class'?: string;
    'src'?: string;
    'alt'?: string;
}

interface IImageContext {
    protypo: Protypo;
}

const Image: React.SFC<IImageProps> = (props, context: IImageContext) => {
    return (
        <img className={[props.class, props.className].join(' ')} src={context.protypo.resolveData(props.src)} alt={props.alt} />
    );
};

Image.contextTypes = {
    protypo: propTypes.object.isRequired
};

export default StyledComponent(Image);