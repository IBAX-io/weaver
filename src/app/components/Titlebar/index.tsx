/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import platform from 'lib/platform';
import desktop from 'lib/desktop';
import { IDesktopBridge } from 'ibax/gui';
import DarwinTitlebar from './DarwinTitlebar';
import ButtonsTitlebar from './ButtonsTitlebar';

export interface ITitlebarProps {
    maximizable?: boolean;
}

export interface IDesktopTitlebarProps extends ITitlebarProps {
    bridge: IDesktopBridge;
}

const StyledControls = styled.div`
    position: relative;
    z-index: 20000;

    .window-title {
        position: absolute;
        text-align: center;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
`;

// Frameless desktop window: draw the platform's window controls. Nothing in the browser.
const Titlebar: React.FC<React.PropsWithChildren<ITitlebarProps>> = props => desktop && (
    <StyledControls>
        {platform.select({
            darwin: (<DarwinTitlebar {...props} bridge={desktop} />),
            linux: (<ButtonsTitlebar {...props} bridge={desktop} variant="linux" />),
            win32: (<ButtonsTitlebar {...props} bridge={desktop} variant="win32" />),

            // Fallback for unsupported platforms
            desktop: (<ButtonsTitlebar {...props} bridge={desktop} variant="linux" />)
        })}
        <div className="window-title">{props.children}</div>
    </StyledControls>
);

export default Titlebar;