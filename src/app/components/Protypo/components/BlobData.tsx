/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as propTypes from 'prop-types';

import Protypo from '../Protypo';

export interface IBlobDataProps {
    link: string;
}

interface IBlobDataContext {
    protypo: Protypo;
}

const IBlobData: React.SFC<IBlobDataProps> = (props, context: IBlobDataContext) => (
    <a className="btn btn-link p0" href={context.protypo.resolveData(props.link)} target="_blank">
        {props.children}
    </a>
);

IBlobData.contextTypes = {
    protypo: propTypes.object.isRequired
};

export default IBlobData;