/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from './StyledComponent';

export interface IEmProps {
    'className'?: string;
    'class'?: string;
}

class Em extends React.Component<IEmProps> {
    render() {
        return (
            <em
                className={[this.props.class, this.props.className].join(' ')}
            >
                {this.props.children}
            </em>
        );
    }
}

export default StyledComponent(Em);
