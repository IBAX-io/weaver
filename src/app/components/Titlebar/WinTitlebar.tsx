/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import imgControls from './wndControls.svg';
import { remote } from 'electron';
import { ITitlebarProps } from './';

import SystemMenu from 'containers/Titlebar/SystemMenu';

const StyledControls = styled.div`
    position: absolute;
    right: 1px;
    left: 0;
    top: 0;

    .window-systemmenu {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 10000;
    }
    
    .window-controls {
        position: absolute;
        right: 0;
        top: 0;

        button {
            cursor: default;
            background: 0;
            border: 0;
            outline: 0;
            padding: 0;
            margin: 0;
            width: 46px;
            height: 28px;
            text-align: center;

            > i {
                background: url(${imgControls}) 0 -56px no-repeat;
                width: 14px;
                height: 14px;
                display: inline-block;
                margin-top: 6px;
            }

            &:hover { background: #aaa; }

            &.quit {
                &:hover { background: #c45f5f; }
                > i { background-position-x: 0; }
            }

            &.maximize > i { background-position-x: -14px; }

            &.restore > i { background-position-x: -42px; }

            &.minimize > i { background-position-x: -28px; }
        }
    }
`;

interface IWinTitlebarState {
    maximized: boolean;
}

class WinTitlebar extends React.Component<ITitlebarProps, IWinTitlebarState> {
    _stateListener = this.onStateChange.bind(this);

    constructor(props: {}) {
        super(props);

        remote.getCurrentWindow().on('maximize', this._stateListener);
        remote.getCurrentWindow().on('unmaximize', this._stateListener);

        this.state = {
            maximized: remote.getCurrentWindow().isMaximized()
        };
    }

    componentWillUnmount() {
        remote.getCurrentWindow().removeListener('maximize', this._stateListener);
        remote.getCurrentWindow().removeListener('unmaximize', this._stateListener);
    }

    onStateChange(e: { sender: { isMaximized: () => boolean } }) {
        this.setState({
            maximized: e.sender.isMaximized()
        });
    }

    onClose() {
        remote.getCurrentWindow().close();
    }

    onMinimize() {
        remote.getCurrentWindow().minimize();
    }

    onMaximize() {
        if (remote.getCurrentWindow().isMaximized()) {
            remote.getCurrentWindow().unmaximize();
        }
        else {
            remote.getCurrentWindow().maximize();
        }
    }

    render() {
        return (
            <StyledControls>
                <div className="window-systemmenu no-drag">
                    <SystemMenu align="left" />
                </div>
                <div className="window-controls no-drag">
                    <button className="minimize" onClick={this.onMinimize}><i /></button>
                    {false !== this.props.maximizable && (
                        <button className={this.state.maximized ? 'restore' : 'maximize'} onClick={this.onMaximize}><i /></button>
                    )}
                    <button className="quit" onClick={this.onClose}><i /></button>
                </div>
            </StyledControls>
        );
    }
}

export default WinTitlebar;