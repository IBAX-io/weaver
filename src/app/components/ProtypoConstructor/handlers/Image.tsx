/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Image extends EditableBlock {
    protected editableDisplay = 'inline';
    protected editable = false;
    renderChildren(classes: string) {
        return (
            <img
                className={classes}
                src={this.props.src}
                alt={this.props.alt}
            />
        );
    }
}

export default DnDComponent(StyledComponent(Image));