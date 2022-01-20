/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';
import { HintWrapper } from 'components/Protypo/handlers/Hint';

class Hint extends EditableBlock {
    protected editableDisplay = 'inline';
    protected editable = false;
    renderChildren(classes: string) {
        let className = 'tool-icon ' + (this.props.icon || 'icon-question');
        return (
            <HintWrapper>
                <div className="tool-body">
                    <em className={className}/>
                </div>
            </HintWrapper>
        );
    }
}

export default DnDComponent(Hint);