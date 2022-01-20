/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class RadioGroup extends EditableBlock {
    protected editableDisplay = 'block';
    protected editable = false;
    renderChildren(classes: string) {
        return (
            <div className={classes}>
                <label>
                    <input
                        type="radio"
                        name="radio"
                    />
                    Option 1
                </label>
                <br/>
                <label>
                    <input
                        type="radio"
                        name="radio"
                    />
                    Option 2
                </label>
            </div>
        );
    }
}

export default DnDComponent(StyledComponent(RadioGroup));