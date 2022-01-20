/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Form extends EditableBlock {
    protected editableDisplay = 'block';
    protected editable = true;

    onSubmit(e: any) {
        e.stopPropagation();
        e.preventDefault();
    }

    renderChildren(classes: string) {
        return (
            <form
                className={classes}
                onSubmit={this.onSubmit.bind(this)}
            >
                {this.props.children || (<FormattedMessage id="editor.designer.emptyform" defaultMessage="Empty form. Drop elements here.<"/>)}
            </form>
        );
    }
}

export default DnDComponent(StyledComponent(Form));