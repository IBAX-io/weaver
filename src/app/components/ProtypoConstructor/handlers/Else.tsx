/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Else extends EditableBlock {
    protected logic = true;
    protected canMove = false;
    protected editableDisplay = 'block';
    protected editable = false;
    renderChildren(classes: string) {
        return (
            <div
                className={classes}
            >
                <span style={{'backgroundColor': '#FFCC66'}}>Else &#123;</span>
                <div>
                    {this.props.children}
                </div>
                <span style={{'backgroundColor': '#FFCC66'}}>&#125;</span>
            </div>
        );
    }
}

export default DnDComponent(StyledComponent(Else));