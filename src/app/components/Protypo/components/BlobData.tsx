/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';

import { ProtypoContext } from '../ProtypoContext';

export interface IBlobDataProps {
    link: string;
}

const IBlobData: React.FC<React.PropsWithChildren<IBlobDataProps>> = props => {
    const context = useContext(ProtypoContext);

    return (
        <a className="btn btn-link p0" href={context.protypo.resolveData(props.link)} target="_blank">
            {props.children}
        </a>
    );
};

export default IBlobData;