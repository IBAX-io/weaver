/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from './StyledComponent';

export interface IPProps {
    'className'?: string;
    'class'?: string;
}

interface IPState {
}

class P extends React.Component<IPProps, IPState> {
    render() {
        return (
            <p
                className={[this.props.class, this.props.className].join(' ')}
            >
                {this.props.children}
            </p>
        );
    }
}

export default StyledComponent(P);
