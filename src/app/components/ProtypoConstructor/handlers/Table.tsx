/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as classnames from 'classnames';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock from './EditableBlock';

class Table extends EditableBlock {
    protected editableDisplay = 'block';
    protected editable = false;
    getClasses() {
        return classnames({
            'table': true,
            [this.props.className]: true,
            'b-selected': this.props.selected
        });
    }

    renderChildren(classes: string) {
        return (
            <table
                className={classes}
            >
                <thead>
                <tr>
                    <th>Column 1</th>
                    <th>Column 2</th>
                    <th>Column 3</th>
                </tr>
                </thead>
                <tbody>
                {this.renderRow(1)}
                {this.renderRow(2)}
                {this.renderRow(3)}
                </tbody>
            </table>
        );
    }

    renderRow(row: number) {
        return (
            <tr>
                <td>
                    Row {row}
                </td>
                <td>
                    Value 1
                </td>
                <td>
                    Value 2
                </td>
            </tr>
        );
    }
}

export default DnDComponent(StyledComponent(Table));