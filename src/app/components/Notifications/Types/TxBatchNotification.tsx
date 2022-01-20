/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { INotificationProto } from 'ibax/notifications';

const TxBatchNotification: INotificationProto<void> = {
  /* icon: 'o-checkround-1', */
  icon: 'fa fa-info-circle',
  title: <FormattedMessage id="tx.error.info" defaultMessage="Information" />,
  body: (params) => (
    <FormattedMessage
      id="notification.tx_batch"
      defaultMessage="Batch processing completed"
    />
  )
};

export default TxBatchNotification;
