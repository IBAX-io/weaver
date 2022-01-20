/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from './StyledComponent';

export interface ISpanProps {
    'className'?: string;
    'class'?: string;
}

class Span extends React.Component<ISpanProps> {
    render() {
        return (
            <span
                className={[this.props.class, this.props.className].join(' ')}
            >
                {this.props.children}
            </span>
        );
    }
}

export default StyledComponent(Span);
