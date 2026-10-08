/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';

export interface ITooltipProps {
    title?: React.JSX.Element | string;
    body?: React.JSX.Element | string;
    children?: React.ReactNode;
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
    private _container = React.createRef<HTMLDivElement>();
    private _tooltip = React.createRef<HTMLDivElement>();

    state: ITooltipState = {
        active: false,
        position: {
            left: 0,
            top: 0
        }
    };

    onHover = () => {
        const container = this._container.current;
        const tooltip = this._tooltip.current;
        let left = 0;
        let top = container.offsetTop;

        if ((container.offsetWidth / 2) + (tooltip.offsetWidth / 2) + container.offsetLeft > window.innerWidth) {
            left = window.innerWidth - tooltip.offsetWidth;
        }
        else if (0 > container.offsetLeft + (container.offsetWidth / 2) - (tooltip.offsetWidth / 2)) {
            left = 0;
        }
        else {
            left = container.offsetLeft - (tooltip.offsetWidth / 2) + (container.offsetWidth / 2);
        }

        if (tooltip.offsetHeight + top + container.offsetHeight > window.innerHeight) {
            top = container.offsetTop - tooltip.offsetHeight;
        }
        else {
            top += container.offsetHeight;
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
            <div ref={this._container}>
                <div onMouseOver={this.onHover} onMouseLeave={this.onLeave}>
                    {this.props.children}
                </div>
                <StyledTooltip
                    ref={this._tooltip}
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