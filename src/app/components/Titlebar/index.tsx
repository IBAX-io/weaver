/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import platform from 'lib/platform';

export interface ITitlebarProps {
    maximizable?: boolean;
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

const Titlebar = platform.select<React.SFC<ITitlebarProps>>({
    web: () => null,
    desktop: props => {
        const DarwinTitlebar = require('./DarwinTitlebar').default;
        const LinuxTitlebar = require('./LinuxTitlebar').default;
        const WinTitlebar = require('./WinTitlebar').default;

        return (
            <StyledControls>
                {platform.select({
                    darwin: (<DarwinTitlebar {...props} />),
                    linux: (<LinuxTitlebar {...props} />),
                    win32: (<WinTitlebar {...props} />),

                    // Fallback for unsupported platforms
                    desktop: (<LinuxTitlebar {...props} />)
                })}
                <div className="window-title">{props.children}</div>
            </StyledControls>
        );
    }
});

export default Titlebar;