/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import ScrollBar from 'react-custom-scrollbars';

const Nop: React.SFC = () => <span />;

export interface IScrollViewProps {
    className?: string;
    disableHorizontal?: boolean;
    disableVertical?: boolean;
    hideHorizontal?: boolean;
    hideVertical?: boolean;
    horizontalWheel?: boolean;
}

const StyledScrollBar = styled(ScrollBar)`
    &.disable-vertical > div {
        overflow-y: hidden !important;
        margin-right: 0 !important;
    }
    
    &.disable-horizontal > div {
        overflow-x: hidden !important;
        margin-bottom: 0 !important;
    }
`;

class ScrollView extends React.Component<IScrollViewProps> {
    private _scrollBar: ScrollBar;

    onMouseWheel: React.EventHandler<React.WheelEvent<ScrollBar>> = e => {
        if (!e.deltaX) {
            e.preventDefault();
            const currentScrollDelta = this._scrollBar.getScrollLeft();
            this._scrollBar.scrollLeft(currentScrollDelta + (e.deltaY * 8));
        }
    }

    calcValue = (...args: boolean[]) => {
        if (args.find(l => l === true)) {
            return Nop;
        }
        else {
            return undefined;
        }
    }

    render() {
        const classes = classNames(this.props.className, {
            'disable-vertical': this.props.disableVertical,
            'disable-horizontal': this.props.disableHorizontal
        });

        return (
            <StyledScrollBar
                innerRef={l => this._scrollBar = l}
                className={classes}
                onWheel={this.props.horizontalWheel && this.onMouseWheel}
                renderTrackHorizontal={this.calcValue(this.props.disableHorizontal, this.props.hideHorizontal)}
                renderThumbHorizontal={this.calcValue(this.props.disableHorizontal, this.props.hideHorizontal)}
                renderTrackVertical={this.calcValue(this.props.disableVertical, this.props.hideVertical)}
                renderThumbVertical={this.calcValue(this.props.disableVertical, this.props.hideVertical)}
            >
                {this.props.children}
            </StyledScrollBar>
        );
    }
}

export default ScrollView;