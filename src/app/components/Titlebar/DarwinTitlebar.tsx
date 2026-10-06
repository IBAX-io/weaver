/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import styled from 'styled-components';
import imgControls from './wndControls.svg';
import { IDesktopTitlebarProps } from './';
import { useWindowState } from './useWindowState';

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

// macOS: traffic lights on the left (alt turns the green one into zoom), system menu on the right
const DarwinTitlebar: React.FC<IDesktopTitlebarProps> = props => {
    const intl = useIntl();
    const { focused } = useWindowState(props.bridge);
    const [isAltDown, setAltDown] = useState(false);
    const label = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => setAltDown(e.altKey);
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKey);
        };
    }, []);

    return (
        <StyledControls className={classNames('drag', { 'window-alt': isAltDown, 'window-blur': !focused })}>
            <div className="window-systemmenu">
                <SystemMenu align="right" />
            </div>
            <div className="window-controls no-drag">
                <button type="button" className="quit" aria-label={label('window.close', 'Close')} onClick={props.bridge.closeWindow} />
                <button type="button" className="minimize" aria-label={label('window.minimize', 'Minimize')} onClick={props.bridge.minimizeWindow} />
                <button
                    type="button"
                    className="zoom"
                    aria-label={isAltDown ? label('window.maximize', 'Maximize') : label('window.fullscreen', 'Full screen')}
                    disabled={false === props.maximizable}
                    onClick={isAltDown ? props.bridge.toggleMaximizeWindow : props.bridge.toggleFullScreen}
                />
            </div>
        </StyledControls>
    );
};

export default DarwinTitlebar;
