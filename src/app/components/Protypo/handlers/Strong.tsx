/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from './StyledComponent';

export interface IStrongProps {
    'className'?: string;
    'class'?: string;
}

class Strong extends React.Component<IStrongProps> {
    render() {
        return (
            <b
                className={[this.props.class, this.props.className].join(' ')}
            >
                {this.props.children}
            </b>
        );
    }
}

export default StyledComponent(Strong);
