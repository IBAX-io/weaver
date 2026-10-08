/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';

import Notifications from 'components/Notifications/NotificationsProvider';

const mapStateToProps = (state: IRootState) => ({
    notifications: state.notifications.notifications
});

export default connect(mapStateToProps)(Notifications);
