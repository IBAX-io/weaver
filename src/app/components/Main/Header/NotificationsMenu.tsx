/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TProtypoElement } from 'ibax/protypo';

import HeaderButton from './HeaderButton';
import Protypo from 'containers/Widgets/Protypo';
import Heading from 'components/Dropdown/Heading';
import Info from 'components/Dropdown/Info';

interface Props {
  offline: boolean;
  count: number;
  mainSection: string;
  notificationsBody: TProtypoElement[];
}

const NotificationsMenu: React.SFC<Props> = (props) => (
  <HeaderButton
    badge={props.count}
    warning={props.offline}
    align="right"
    menuWidth={250}
    content={
      <div style={{ overflow: 'hidden' }}>
        <Heading>
          {props.offline ? (
            <FormattedMessage
              id="general.error.socket"
              defaultMessage="Notifications are unavailable"
            />
          ) : (
            <FormattedMessage
              id="notifications"
              defaultMessage="Notifications"
            />
          )}
        </Heading>
        <div>
          {props.offline ? (
            <Info>
              <FormattedMessage
                id="general.error.socket.desc"
                defaultMessage="Failed to establish connection to the WebSocket server. Check your configuration"
              />
            </Info>
          ) : (
            <Protypo
              section={props.mainSection}
              context="menu"
              content={props.notificationsBody}
            />
          )}
        </div>
      </div>}
  >
    {props.offline ? (
      <em className="icon fa fa-exclamation" />
    ) : (
      <em className="icon fa fa-flag" />
    )}
  </HeaderButton>
);

export default NotificationsMenu;
