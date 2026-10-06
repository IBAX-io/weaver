/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import imgControls from './wndControls.svg';
import { IDesktopTitlebarProps } from './';
import { useWindowState } from './useWindowState';

import SystemMenu from 'containers/Titlebar/SystemMenu';

// Windows and Linux: system menu on the left, minimize / maximize / close on the right
const StyledControls = styled.div<{ $variant: 'win32' | 'linux' }>`
    position: absolute;
    right: ${props => 'win32' === props.$variant ? '1px' : '0'};
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
            width: ${props => 'win32' === props.$variant ? '46px' : '28px'};
            height: 28px;
            text-align: center;
            opacity: ${props => 'win32' === props.$variant ? 1 : 0.5};

            > i {
                background: url(${imgControls}) 0 ${props => 'win32' === props.$variant ? '-56px' : '-70px'} no-repeat;
                width: 14px;
                height: 14px;
                display: inline-block;
                margin-top: 6px;
            }

            &:hover, &:focus-visible {
                ${props => 'win32' === props.$variant ? 'background: #aaa;' : 'opacity: 0.8;'}
            }

            &.quit {
                &:hover, &:focus-visible {
                    ${props => 'win32' === props.$variant ? 'background: #c45f5f;' : ''}
                }
                > i { background-position-x: 0; }
            }

            &.maximize > i { background-position-x: -14px; }

            &.restore > i { background-position-x: -42px; }

            &.minimize > i { background-position-x: -28px; }
        }
    }
`;

const ButtonsTitlebar: React.FC<IDesktopTitlebarProps & { variant: 'win32' | 'linux' }> = props => {
    const intl = useIntl();
    const { maximized } = useWindowState(props.bridge);
    const label = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });

    return (
        <StyledControls $variant={props.variant}>
            <div className="window-systemmenu no-drag">
                <SystemMenu align="left" />
            </div>
            <div className="window-controls no-drag">
                <button type="button" className="minimize" aria-label={label('window.minimize', 'Minimize')} onClick={props.bridge.minimizeWindow}><i /></button>
                {false !== props.maximizable && (
                    <button
                        type="button"
                        className={maximized ? 'restore' : 'maximize'}
                        aria-label={maximized ? label('window.restore', 'Restore') : label('window.maximize', 'Maximize')}
                        onClick={props.bridge.toggleMaximizeWindow}
                    >
                        <i />
                    </button>
                )}
                <button type="button" className="quit" aria-label={label('window.close', 'Close')} onClick={props.bridge.closeWindow}><i /></button>
            </div>
        </StyledControls>
    );
};

export default ButtonsTitlebar;
