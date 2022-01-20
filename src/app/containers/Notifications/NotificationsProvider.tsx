/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { INotification } from 'ibax/notifications';
import { destroyNotification } from 'modules/notifications/actions';

import Notifications from 'components/Notifications/NotificationsProvider';

export interface INotificationsProviderContainerProps {

}

interface INotificationsProviderContainerState {
    notifications: INotification[];
}

interface INotificationsProviderContainerDispatch {
    spawnNotification: (notification: INotification) => void;
    destroyNotification: (id: string) => void;
}

const NotificationsProviderContainer: React.SFC<INotificationsProviderContainerProps & INotificationsProviderContainerState & INotificationsProviderContainerDispatch> = props => (
    <Notifications {...props} />
);

const mapStateToProps = (state: IRootState) => ({
    notifications: state.notifications.notifications
});

const mapDispatchToProps = {
    destroyNotification
};

export default connect<INotificationsProviderContainerState, INotificationsProviderContainerDispatch, INotificationsProviderContainerProps>(mapStateToProps, mapDispatchToProps)(NotificationsProviderContainer);