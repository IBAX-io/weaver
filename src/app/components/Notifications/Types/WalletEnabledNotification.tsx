/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { INotificationProto } from 'ibax/notifications';

// An account set up for a network of other key algorithms, and its address there
const WalletEnabledNotification: INotificationProto<{ address: string }> = {
    icon: 'fa fa-info-circle',
    title: () => (
        <FormattedMessage id="auth.network.enabled" defaultMessage="Account set up for this network" />
    ),
    body: params => (
        <FormattedMessage
            id="auth.network.enabled.address"
            defaultMessage="Its address on this network: {address}"
            values={{ address: <span className="font-monospace">{params.address}</span> }}
        />
    )
};

export default WalletEnabledNotification;
