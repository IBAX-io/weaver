/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { INotificationProto } from 'ibax/notifications';

const InvalidPasswordNotification: INotificationProto<void> = {
    icon: 'o-warninground-1',
    title: (
        <FormattedMessage id="tx.error.error" defaultMessage="Error" />
    ),
    body: (
        <FormattedMessage id="auth.error.E_INVALID_PASSWORD" defaultMessage="Invalid password" />
    )
};

export default InvalidPasswordNotification;