/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { remote } from 'electron';
import { FormattedMessage } from 'react-intl';

import themed from 'components/Theme/themed';
import DropdownButton from 'components/Button/DropdownButton';
import Heading from 'components/Dropdown/Heading';
import Item from 'components/Dropdown/Item';

const SystemDropdown = themed(DropdownButton)`
    background: 0;
    border: 0;
    outline: 0;
    color: #bad8ff;
    width: ${props => props.theme.headerHeight}px !important;
    height: ${props => props.theme.headerHeight}px !important;
    padding: 0 !important;
    margin: 0 !important;
    outline: 0 !important;
    min-width: 0 !important;
    line-height: ${props => props.theme.headerHeight + 2}px !important;
    transition: color ease-in-out .16s;
    cursor: pointer !important;

    &:hover {
        color: #fff;
    }
`;

export interface ISystemMenuProps {
    align: 'left' | 'right';
    onAbout: () => void;
}

const SystemMenu: React.SFC<ISystemMenuProps> = props => {
    const elements = [
        (
            <SystemDropdown
                key="1"
                align={props.align}
                content={
                    <div>
                        <Heading>
                            <FormattedMessage id="general.title" defaultMessage="Ibax" />
                        </Heading>
                        <Item onClick={props.onAbout} icon="icon-question text-primary">
                            <FormattedMessage id="general.about" defaultMessage="About" />
                        </Item>
                        <Item onClick={() => remote.getCurrentWindow().webContents.openDevTools({ mode: 'detach' })} icon="icon-calculator text-danger">
                            <FormattedMessage id="general.developer.tools" defaultMessage="Developer tools" />
                        </Item>
                    </div>
                }
            >
                <em className="icon-list" />
            </SystemDropdown>
        )
    ];
    return (
        <div className="no-drag">
            {(props.align === 'left' ? elements : elements.reverse()).map((e, i) => (
                e
            ))}
        </div>
    );
};

export default SystemMenu;