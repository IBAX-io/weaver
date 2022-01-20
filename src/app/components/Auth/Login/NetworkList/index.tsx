/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import { INetwork, INetworkEndpoint } from 'ibax/auth';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import ContextButton from '../ContextButton';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';
import NetworkListView from './NetworkListView';
import { FormattedMessage } from 'react-intl';

export interface INetworkListProps {
  pending: boolean;
  current?: INetworkEndpoint;
  networks: INetwork[];
  preconfiguredNetworks: INetwork[];
  onAddNetwork?: () => void;
  onConnect?: (uuid: string) => void;
  onRemove?: (network: INetwork) => void;
}

const NetworkList: React.SFC<INetworkListProps> = (props) => (
  <LocalizedDocumentTitle title="auth.login" defaultTitle="Login">
    <div className={classNames('desktop-flex-col desktop-flex-stretch')}>
      <HeadingNetwork returnUrl="/">
        <FormattedMessage id="general.networks" defaultMessage="Networks" />
      </HeadingNetwork>

      <div className="text-left" style={{ margin: -15, marginBottom: 15 }}>
        <NetworkListView
          pending={props.pending}
          current={props.current && props.current.uuid}
          preconfiguredNetworks={props.preconfiguredNetworks}
          networks={props.networks}
          onConnect={props.onConnect}
          onRemove={props.onRemove}
        />
      </div>
      <div>
        <ContextButton
          icon="icon-plus"
          onClick={props.onAddNetwork}
          description={
            <FormattedMessage
              id="general.network.add.desc"
              defaultMessage="Specify connection details and connect to another network not listed there"
            />
          }
        >
          <FormattedMessage
            id="general.network.add"
            defaultMessage="Add network"
          />
        </ContextButton>
      </div>
    </div>
  </LocalizedDocumentTitle>
);

export default NetworkList;
