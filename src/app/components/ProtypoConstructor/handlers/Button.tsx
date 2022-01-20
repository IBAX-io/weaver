/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import ContentEditable from 'react-contenteditable';
import EditableBlock from './EditableBlock';

class Button extends EditableBlock {
    protected editableTag = 'span';
    protected editableDisplay = 'inline';
    protected renderTag = 'button';

    contentEditable(tagName: string, classes: string) {
        return (
            <button
                className={classes}
            >
                <ContentEditable
                    tagName={tagName}
                    html={this.props.childrenText}
                    onChange={this.handleChange.bind(this)}
                />
            </button>
        );
    }
}

export default DnDComponent(StyledComponent(Button));
