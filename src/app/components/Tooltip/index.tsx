/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';

export interface ITooltipProps {
    title?: JSX.Element | string;
    body?: JSX.Element | string;
}

interface ITooltipState {
    active: boolean;
    position: {
        left: number;
        top: number;
    };
}

const StyledTooltip = themed.div`
    position: absolute;
    padding: 10px;
    z-index: 700;

    > div {
        line-height: 16px;
        font-size: 14px;
        background-color: rgba(0,0,0,0.7);
        padding: 14px;
        color: #fff;
        max-width: 240px;
        text-align: left;
        
        .tooltip-head {
            font-weight: bold;
            margin-bottom: 3px;
        }
    }
`;

class Tooltip extends React.Component<ITooltipProps, ITooltipState> {
    private _container: HTMLDivElement = null;
    private _tooltip: HTMLDivElement = null;

    state: ITooltipState = {
        active: false,
        position: {
            left: 0,
            top: 0
        }
    };

    onHover = (e: React.MouseEvent<HTMLDivElement>) => {
        let left = 0;
        let top = this._container.offsetTop;

        if ((this._container.offsetWidth / 2) + (this._tooltip.offsetWidth / 2) + this._container.offsetLeft > window.innerWidth) {
            left = window.innerWidth - this._tooltip.offsetWidth;
        }
        else if (0 > this._container.offsetLeft + (this._container.offsetWidth / 2) - (this._tooltip.offsetWidth / 2)) {
            left = 0;
        }
        else {
            left = this._container.offsetLeft - (this._tooltip.offsetWidth / 2) + (this._container.offsetWidth / 2);
        }

        if (this._tooltip.offsetHeight + top + this._container.offsetHeight > window.innerHeight) {
            top = this._container.offsetTop - this._tooltip.offsetHeight;
        }
        else {
            top += this._container.offsetHeight;
        }

        this.setState({
            active: true,
            position: {
                left: Math.floor(left),
                top: Math.floor(top),
            }
        });
    }

    onLeave = () => {
        this.setState({
            active: false
        });
    }

    render() {
        return (
            <div ref={l => this._container = l}>
                <div onMouseOver={this.onHover} onMouseLeave={this.onLeave}>
                    {this.props.children}
                </div>
                <StyledTooltip
                    innerRef={l => this._tooltip = l}
                    style={{
                        top: this.state.active ? this.state.position.top : -50000,
                        left: this.state.active ? this.state.position.left : -50000
                    }}
                >
                    <div>
                        {this.props.title && (<div className="tooltip-head">{this.props.title}</div>)}
                        {this.props.body && (<div>{this.props.body}</div>)}
                    </div>
                </StyledTooltip>
            </div>
        );
    }
}

export default Tooltip;