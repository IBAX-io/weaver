/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { ISource } from 'ibax/protypo';

import SimpleSource from './SimpleSource';

export interface IRangeProps extends Pick<ISource, 'data' | 'columns'> {
    source?: string;
}

const Range: React.SFC<IRangeProps> = props => (
    <SimpleSource
        source={props.source}
        columns={props.columns}
        types={[]}
        data={props.data}
    />
);

export default Range;