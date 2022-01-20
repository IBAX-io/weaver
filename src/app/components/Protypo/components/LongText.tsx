/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as propTypes from 'prop-types';

import Protypo from '../Protypo';

export interface ILongTextProps {
    link: string;
}

interface ILongTextContext {
    protypo: Protypo;
}

const LongText: React.SFC<ILongTextProps> = (props, context: ILongTextContext) => {
    const onClick = () => {
        context.protypo.displayData(props.link);
    };

    return (
        <button className="btn btn-link p0" onClick={onClick}>
            {props.children}...
        </button>
    );
};

LongText.contextTypes = {
    protypo: propTypes.object.isRequired
};

export default LongText;