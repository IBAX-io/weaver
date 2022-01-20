/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import propTypes from 'prop-types';
import { ISource } from 'ibax/protypo';

import Protypo from '../';

export interface ISimpleSourceProps extends ISource {
    source: string;
}

interface ISimpleSourceContext {
    protypo: Protypo;
}

const SimpleSource: React.SFC<ISimpleSourceProps> = (props, context: ISimpleSourceContext) => {
    context.protypo.registerSource(props.source, {
        columns: props.columns,
        types: props.types,
        data: props.data
    });
    return null;
};

SimpleSource.contextTypes = {
    protypo: propTypes.object.isRequired
};

export default SimpleSource;