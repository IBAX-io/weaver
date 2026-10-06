/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';

import { ProtypoContext } from '../ProtypoContext';

export interface ILongTextProps {
    link: string;
}

const LongText: React.FC<React.PropsWithChildren<ILongTextProps>> = props => {
    const context = useContext(ProtypoContext);
    const onClick = () => {
        context.protypo.displayData(props.link);
    };

    return (
        <button className="btn btn-link p0" onClick={onClick}>
            {props.children}...
        </button>
    );
};

export default LongText;