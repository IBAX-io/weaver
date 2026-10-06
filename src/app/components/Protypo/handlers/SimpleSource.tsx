/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';
import { ISource } from 'ibax/protypo';

import { ProtypoContext } from '../ProtypoContext';

export interface ISimpleSourceProps extends ISource {
    source: string;
}

const SimpleSource: React.FC<ISimpleSourceProps> = props => {
    const context = useContext(ProtypoContext);
    context.protypo.registerSource(props.source, {
        columns: props.columns,
        types: props.types,
        data: props.data
    });
    return null;
};

export default SimpleSource;