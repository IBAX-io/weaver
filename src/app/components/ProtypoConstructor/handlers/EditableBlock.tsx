/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import classnames from 'classnames';
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable';
import { ConnectDragSource } from '@nosferatu500/react-dnd';
import TagWrapper from '../components/TagWrapper';
import { OnPasteStripFormatting } from 'lib/constructor/helpers';
import { IConstructorElementProps } from 'ibax/editor';

export interface IEditableBlockProps extends IConstructorElementProps {
    'children'?: React.ReactNode;
    'className'?: string;
    'class'?: string;
    'childrenText'?: string;
    'tail'?: React.ReactNode;

    // Injected by DnDComponent
    'dndRef'?: React.RefCallback<HTMLElement>;
    'connectDragSource'?: ConnectDragSource;

    'src'?: string;
    'alt'?: string;
    'for'?: string;
    'name'?: string;
    'disabled'?: string;
    'placeholder'?: string;
    'type'?: string;
    'icon'?: string;
    'title'?: string;
    'text'?: string;
}

interface IEditableBlockState {
    condition: boolean;
}

export default class EditableBlock extends React.Component<IEditableBlockProps, IEditableBlockState> {
    protected logic = false;
    protected editableTag = 'div';
    protected editableDisplay = 'block';
    protected renderTag = 'div';
    protected editable = true;
    protected canMove = true;

    private _text = '';

    constructor(props: IEditableBlockProps) {
        super(props);
        this._text = props.childrenText;
    }

    notEmpty(childrenText: string) {
        return childrenText !== undefined && childrenText !== null && childrenText.length >= 0;
    }
    hasTag(text: string) {
        return text.indexOf('<') === -1;
    }
    classChanged(nextProps: IEditableBlockProps): boolean {
        return this.props.class !== nextProps.class;
    }
    tailChanged(nextProps: IEditableBlockProps): boolean {
        return this.props.tail !== nextProps.tail;
    }
    conditionChanged(nextState: IEditableBlockState): boolean {
        return this.state && nextState && this.state.condition !== nextState.condition;
    }
    elementSelectedAndNotEmptyChildrenText(nextProps: IEditableBlockProps): boolean {
        return this.props.selected && this.notEmpty(this.props.childrenText)
            && nextProps.selected && this.notEmpty(nextProps.childrenText);
    }
    getClasses() {
        return classnames({
            [this.props.class]: true,
            [this.props.className]: true,
            'b-selected': this.props.selected
        });
    }
    shouldComponentUpdate(nextProps: IEditableBlockProps, nextState: IEditableBlockState) {
        if (!nextProps.selected) {
            return true;
        }

        if (this.elementSelectedAndNotEmptyChildrenText(nextProps)) {
            if (this.hasTag(nextProps.childrenText)) {
                return true;
            }
            return (
                this.classChanged(nextProps)
                || this.tailChanged(nextProps)
                || this.conditionChanged(nextState)
            );
        }

        return true;
    }

    onPaste(e: React.ClipboardEvent<HTMLElement>) {
        OnPasteStripFormatting(this, e);
    }

    onClick(e: React.MouseEvent<HTMLElement>) {
        e.stopPropagation();
        this.props.selectTag(this.props.tag);
    }

    handleChange(e: ContentEditableEvent) {
        this._text = e.target.value;
    }

    handleBlur() {
        this.props.changePage({ text: this._text, tagID: this.props.tag.id });
    }

    removeTag() {
        this.props.removeTag({ tag: this.props.tag });
    }

    hasChildrenText() {
        return this.props.selected && this.props.childrenText !== undefined && this.props.childrenText !== null && this.props.childrenText.length >= 0;
    }
    contentEditable(tagName: string, classes: string) {
        return (
            <ContentEditable
                tagName={tagName}
                className={classes}
                html={this.props.childrenText}
                onChange={this.handleChange.bind(this)}
                onBlur={this.handleBlur.bind(this)}
            />
        );
    }
    renderChildrenWrapper() {
        const classes = this.getClasses();
        return (
            (this.hasChildrenText() && this.editable) ? (
                this.contentEditable(this.editableTag, classes)
            ) : (
                    this.renderChildren(classes)
                )
        );
    }
    renderChildren(classes: string): React.ReactNode {
        const Tag = this.renderTag as React.ElementType;
        return (
            <Tag
                className={classes}
            >
                {this.props.children}
            </Tag>
        );
    }
    render() {
        if (this.logic && !this.props.logic) {
            return null;
        }
        const { dndRef, connectDragSource, isOver } = this.props;
        const style = {
            display: (this.editableDisplay === 'inline') ? 'inline-block' : ''
        };

        return (
            <span style={style} ref={dndRef}>
                <TagWrapper
                    display={this.editableDisplay}
                    selected={this.props.selected}
                    canDrop={isOver}
                    canDropPosition={this.props.canDropPosition}
                    onClick={this.onClick.bind(this)}
                    removeTag={this.removeTag.bind(this)}
                    connectDragSource={connectDragSource}
                    canMove={this.canMove}
                >
                    {this.renderChildrenWrapper()}
                </TagWrapper>
            </span>
        );
    }
}