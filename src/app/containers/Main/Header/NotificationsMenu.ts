/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';

import NotificationsMenu from 'components/Main/Header/NotificationsMenu';
import findNotificationsCount from 'modules/socket/util/findNotificationsCount';

const mapStateToProps = (state: IRootState) => ({
    count: findNotificationsCount(state.socket, state.auth.wallet),
    offline: !state.socket.connected,
    mainSection: state.sections.mainSection,
    notificationsBody: state.content.notifications
});

export default connect(mapStateToProps)(NotificationsMenu);