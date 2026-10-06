/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import styled from 'styled-components';
import imgControls from './wndControls.svg';
import { IDesktopTitlebarProps } from './';

import SystemMenu from 'containers/Titlebar/SystemMenu';

const StyledControls = styled.div`
    -webkit-app-region: no-drag;

    .window-systemmenu {
        position: absolute;
        right: 0;
        top: 0;
        z-index: 10000;
    }

    .window-controls {
        position: absolute;
        left: 6px;
        top: 2px;

        button {
            background: url(${imgControls}) 0 0 no-repeat;
            border: 0;
            outline: 0;
            padding: 0;
            margin: 3px;
            width: 14px;
            height: 14px;

            &:active {
                background-position-x: -28px !important;
            }

            &.quit {
                background-position-y: 0;
            }

            &.minimize {
                background-position-y: -14px;
            }

            &.zoom {
                background-position-y: -28px;
            }

            &.zoom:disabled {
                background-position: -42px 0;
            }
        }
    }

    &.window-blur .window-controls button {
        &.quit, &.minimize, &.zoom {
            background-position: -42px 0;
        }
    }

    .window-controls:hover button {
        background-position-x: -14px;
    }

    .window-controls:active button {
        background-position-x: -14px;
    }

    &.window-alt button.zoom {
        background-position-y: -42px;
    }
`;

interface ITitlebarState {
    isAltDown: boolean;
    isFocused: boolean;
}

class DarwinTitlebar extends React.Component<IDesktopTitlebarProps, ITitlebarState> {
    private _keyListener = this.onKeyEvent.bind(this);
    private _unsubscribe: () => void = null;

    constructor(props: IDesktopTitlebarProps) {
        super(props);
        this.state = {
            isAltDown: false,
            isFocused: props.bridge.getWindowState().focused
        };
    }

    componentDidMount() {
        window.addEventListener('keydown', this._keyListener);
        window.addEventListener('keyup', this._keyListener);
        this._unsubscribe = this.props.bridge.onWindowState(state => this.setState({ isFocused: state.focused }));
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this._keyListener);
        window.removeEventListener('keyup', this._keyListener);
        this._unsubscribe();
    }

    onKeyEvent(e: KeyboardEvent) {
        this.setState({
            isAltDown: e.altKey
        });
    }

    onClose = () => this.props.bridge.closeWindow();

    onMinimize = () => this.props.bridge.minimizeWindow();

    onFullscreen = () => this.props.bridge.toggleFullScreen();

    onZoom = () => this.props.bridge.toggleMaximizeWindow();

    render() {
        const controlClasses = classNames('drag', {
            'window-alt': this.state.isAltDown,
            'window-blur': !this.state.isFocused
        });

        return (
            <StyledControls className={controlClasses}>
                <div className="window-systemmenu">
                    <SystemMenu align="right" />
                </div>
                <div className="window-controls no-drag">
                    <button className="quit" onClick={this.onClose} />
                    <button className="minimize" onClick={this.onMinimize} />
                    <button className="zoom" disabled={false === this.props.maximizable} onClick={this.state.isAltDown ? this.onZoom : this.onFullscreen} />
                </div>
            </StyledControls>
        );
    }
}

export default DarwinTitlebar;