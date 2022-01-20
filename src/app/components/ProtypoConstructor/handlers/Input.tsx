/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Input extends EditableBlock {
    protected editableDisplay = 'block';
    protected editable = false;
    renderChildren(classes: string) {
        return (
            <input
                name={this.props.name}
                className={classes}
                disabled={!!this.props.disabled}
                type={this.props.type}
                placeholder={this.props.placeholder}
            />
        );
    }
}

export default DnDComponent(StyledComponent(Input));