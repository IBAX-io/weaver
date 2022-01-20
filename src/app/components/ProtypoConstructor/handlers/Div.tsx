/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Div extends EditableBlock {
    protected editableTag = 'div';
    protected editableDisplay = 'block';
    protected renderTag = 'div';

    renderChildren(classes: string) {
        return (
            <div
                className={classes}
            >
                {this.props.children || (<FormattedMessage id="editor.designer.emptyblock" defaultMessage="Empty block. Drop elements here.<"/>)}
            </div>
        );
    }
}

export default DnDComponent(StyledComponent(Div));
