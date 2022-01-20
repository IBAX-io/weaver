/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from './StyledComponent';

export interface ILabelProps {
    'className'?: string;
    'class'?: string;
    'for'?: string;
}

class Label extends React.Component<ILabelProps> {
    render() {
        return (
            <label htmlFor={this.props.for} className={[this.props.class, this.props.className].join(' ')}>{this.props.children}</label>
        );
    }
}

export default StyledComponent(Label);