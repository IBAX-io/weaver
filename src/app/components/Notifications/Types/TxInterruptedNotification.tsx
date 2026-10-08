/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { INotificationProto } from 'ibax/notifications';

// The password prompt of a transaction was closed by another window before it was answered
const TxInterruptedNotification: INotificationProto<void> = {
    icon: 'o-warninground-1',
    title: (
        <FormattedMessage id="tx.error.error" defaultMessage="Error" />
    ),
    body: (
        <FormattedMessage id="tx.interrupted" defaultMessage="The transaction was not signed: another window replaced the password prompt. Please try again." />
    )
};

export default TxInterruptedNotification;
