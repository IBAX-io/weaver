/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import DropdownButton from 'components/Button/DropdownButton';
import ToolButton from './ToolButton';
import themed from 'components/Theme/themed';

interface Props {
    disabled?: boolean;
    icon?: string;
    content: React.ReactNode;
}

const DropdownChevron = themed.em`
    font-size: 14px;
    margin-left: 8px;
`;

const DropdownToolButton: React.SFC<Props> = props => (
    <DropdownButton
        buttonComponent={p => <ToolButton {...p} icon={props.icon} />}
        disabled={props.disabled}
        content={props.content}
    >
        {props.children}
        <DropdownChevron className="icon-chevron icon-arrow-down" />
    </DropdownButton>
);

export default DropdownToolButton;