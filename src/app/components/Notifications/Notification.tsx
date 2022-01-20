/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { INotificationProto } from 'ibax/notifications';

import themed from 'components/Theme/themed';

export interface INotificationProps {
    className?: string;
    proto: INotificationProto<any>;
    params: {
        [key: string]: any;
    };
}

const Notification: React.SFC<INotificationProps> = props => (
    <div className={props.className}>
        {props.proto.icon && (
            <div className="notification-icon">
                <em className={props.proto.icon} />
            </div>
        )}
        <div className="notification-title">{typeof props.proto.title === 'function' ? props.proto.title(props.params) : props.proto.title}</div>
        <div className="notification-body">{typeof props.proto.body === 'function' ? props.proto.body(props.params) : props.proto.body}</div>
        {/*<div className="notification-controls">
            <NotificationButton>Confirm</NotificationButton>
            <NotificationButton>Cancel</NotificationButton>
    </div>*/}
    </div>
);

export default themed(Notification) `
    background: ${props => props.theme.notificationBackground};
    width: 350px;
    margin-bottom: 15px;
    padding: 15px;

    .notification-icon {
        float: left;
        font-size: 30px;
        color: ${props => props.theme.notificationIconColor};
        vertical-align: top;
        margin-right: 15px;
        margin-left: 5px;
        width: 30px;
        text-align: right;
    }

    .notification-title {
        font-size: 15px;
        color: ${props => props.theme.notificationPrimaryForeground};
    }

    .notification-body {
        font-size: 14px;
        color: ${props => props.theme.notificationForeground};
    }

    .notification-controls {
        margin-top: 10px;
        display: flex;
        flex-direction: row;
    }
`;