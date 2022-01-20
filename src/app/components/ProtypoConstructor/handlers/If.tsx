/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import StyledComponent from 'components/Protypo/handlers/StyledComponent';
import DnDComponent from './DnDComponent';
import EditableBlock, { IEditableBlockProps } from './EditableBlock';
import Switch from 'components/Main/Editor/Designer/Switch';

export class If extends EditableBlock {
    protected logic = true;
    protected editableDisplay = 'block';
    protected editable = false;
    constructor(props: IEditableBlockProps) {
        super(props);
        this.state = {
            condition: true
        };
    }

    toggleCondition() {
        this.setState({
            condition: !this.state.condition
        });
    }

    renderSwitch(tag: string) {
        return (
            <span style={{'backgroundColor': '#FFCC66'}}>{tag}
                <Switch
                    initialValue={this.state.condition}
                    onValue={true}
                    offValue={false}
                    onChange={this.toggleCondition.bind(this)}
                /> &#123;
            </span>
        );
    }

    renderChildren(classes: string) {
        return (
            <div
                className={classes}
            >
                {this.renderSwitch('If')}
                {this.state.condition && (<div>{this.props.children} </div>) || (<span>...</span>)}
                <span style={{'backgroundColor': '#FFCC66'}}>&#125;</span>
                {!this.state.condition && this.props.tail}
            </div>
        );
    }
}

export default DnDComponent(StyledComponent(If));