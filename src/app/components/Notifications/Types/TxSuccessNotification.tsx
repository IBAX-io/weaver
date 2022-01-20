/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { INotificationProto } from 'ibax/notifications';
import { ITransactionCall } from 'ibax/tx';

const TxSuccessNotification: INotificationProto<{
  block: string;
  tx: ITransactionCall;
}> = {
  /* icon: 'o-checkround-1', */
  icon: 'fa fa-info-circle',
  title: (params) => '', // params.tx.contract.name,
  body: (params) => (
    <FormattedMessage
      id="notification.tx_imprinted"
      defaultMessage="Imprinted in the blockchain (block {block})"
      values={{ block: params.block }}
    />
  )
};

export default TxSuccessNotification;
