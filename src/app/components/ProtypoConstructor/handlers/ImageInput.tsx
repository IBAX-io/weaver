/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import classnames from 'classnames';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class ImageInput extends EditableBlock {
    protected editableDisplay = 'inline';
    protected editable = false;
    renderChildren(classes: string) {
        return (
            <div
                className={classes}
            >
                <input type="text" className="form-control" readOnly={true}/>
                <button className="btn btn-secondary" type="button">
                    <em className="fa fa-folder-open" />
                </button>
            </div>
        );
    }
    getClasses() {
        return classnames({
            'b-selected': this.props.selected,
            'input-group': true
        });
    }
}

export default DnDComponent(ImageInput);