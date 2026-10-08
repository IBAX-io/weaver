/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { INotification, INotificationProto } from 'ibax/notifications';

import StreamGroup from '../Animation/StreamGroup';
import Notification from './Notification';
import TxSuccessNotification from './Types/TxSuccessNotification';
import InvalidPasswordNotification from './Types/InvalidPasswordNotification';
import TxBatchNotification from './Types/TxBatchNotification';
import TxInterruptedNotification from './Types/TxInterruptedNotification';
import EcosystemInvitedNotification from './Types/EcosystemInvitedNotification';
import WalletEnabledNotification from './Types/WalletEnabledNotification';

const definitions: { [key: string]: INotificationProto<any> } = {
    'TX_BATCH': TxBatchNotification,
    'TX_SUCCESS': TxSuccessNotification,
    'INVALID_PASSWORD': InvalidPasswordNotification,
    'TX_INTERRUPTED': TxInterruptedNotification,
    'ECOSYSTEM_INVITED': EcosystemInvitedNotification,
    'WALLET_ENABLED': WalletEnabledNotification
};

export interface INotificationsProviderProps {
    notifications: INotification[];
}

class NotificationsProvider extends React.Component<INotificationsProviderProps> {
    render() {
        return (
            <div style={{ position: 'fixed', top: '12%', left: '50%', marginLeft: '-175px', zIndex: 10000 }}>
                <StreamGroup
                    // Notifications of a type the client does not know are not shown
                    items={this.props.notifications
                        .filter(n => !!definitions[n.type])
                        .map(n => ({
                            key: n.id,
                            content: (
                                <Notification proto={definitions[n.type]} params={n.params} />
                            )
                        }))}
                />
            </div>
        );
    }
}

export default NotificationsProvider;