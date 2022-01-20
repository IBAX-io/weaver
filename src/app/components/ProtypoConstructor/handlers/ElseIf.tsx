/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import { If } from './If';

class ElseIf extends If {
    protected logic = true;
    protected canMove = false;
    protected editableDisplay = 'block';
    protected editable = false;

    renderChildren(classes: string) {
        return (
            <div
                className={classes}
            >
                {this.renderSwitch('ElseIf')}
                <div>
                    {this.state.condition && this.props.children}
                </div>
                <span style={{'backgroundColor': '#FFCC66'}}>&#125;</span>
            </div>
        );
    }
}

export default DnDComponent(StyledComponent(ElseIf));
