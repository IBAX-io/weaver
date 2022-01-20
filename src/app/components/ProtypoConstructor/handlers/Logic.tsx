/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Logic extends EditableBlock {
    protected editableDisplay = 'inline';
    protected editable = false;
    protected logic = true;
    renderChildren(classes: string) {
        return (
            <span style={{'backgroundColor': '#FFCC66'}}>
                {this.props.tag.tag}
            </span>
        );
    }
}

export default DnDComponent(StyledComponent(Logic));