/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';

export interface INotificationButtonProps {
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const NotificationButton: React.SFC<INotificationButtonProps> = props => (
    <button className={props.className} onClick={props.onClick}>
        {props.children}
    </button>
);

export default styled(NotificationButton) `
    flex: 1;
    background: rgba(255, 255, 255, 0.15);
    height: 30px;
    border: 0;
    color: #fff;
    text-transform: uppercase;
    margin-right: 5px;
    font-size: 13px;
    transition: background ease-in-out .2s;

    &:last-child {
        margin-right: 0;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    &:active {
        background: rgba(255, 255, 255, 0.1);
    }
`;