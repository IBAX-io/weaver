/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from 'modules/socket';
import { IAccountContext } from 'ibax/auth';

const findNotifications = (state: State, session: IAccountContext) => {
    if (!session) {
        return [];
    }

    if (!session.access) {
        return [];
    }

    if (!session.wallet) {
        return [];
    }

    return state.notifications.filter(notification =>
        notification.id === session.wallet.id &&
        notification.ecosystem === session.access.ecosystem &&
        (session.role && notification.role === session.role.id || notification.role === '0')
    );
};

export default findNotifications;