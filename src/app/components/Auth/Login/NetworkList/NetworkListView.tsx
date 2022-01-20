/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import { INetwork } from 'ibax/auth';

import Table from 'components/Table';

export interface INetworkListViewProps {
  pending?: boolean;
  current?: string;
  preconfiguredNetworks: INetwork[];
  networks: INetwork[];
  onConnect?: (uuid: string) => void;
  onRemove?: (network: INetwork) => void;
}

interface INetworkActionsProps {
  disabled?: boolean;
  onConnect?: () => void;
  onRemove?: () => void;
}

const NetworkActions: React.SFC<INetworkActionsProps> = (props) => (
  <div style={{ whiteSpace: 'nowrap' }}>
    {props.onConnect && (
      <button
        className="btn btn-link p0 mr"
        disabled={props.disabled}
        onClick={props.onConnect}
      >
        <FormattedMessage
          id="general.network.connect"
          defaultMessage="Connect"
        />
      </button>
    )}
    {props.onRemove && (
      <button
        className="btn btn-link p0"
        disabled={props.disabled}
        onClick={props.onRemove}
      >
        <FormattedMessage id="general.network.remove" defaultMessage="Remove" />
      </button>
    )}
  </div>
);

const NetworkName: React.SFC<{ name: string; current: boolean }> = (props) => (
  <div>
    {props.current && (
      <b>
        (
        <FormattedMessage
          id="general.network.current"
          defaultMessage="Current"
        />
        )&nbsp;
      </b>
    )}
    {props.name}
  </div>
);

class NetworkListView extends React.Component<
  INetworkListViewProps & InjectedIntlProps
> {
  buildRow = (network: INetwork, preconfigured?: boolean) => [
    <b key={network.uuid} style={{ whiteSpace: 'nowrap' }}>
      {network.id}
    </b>,
    <NetworkName
      key={network.uuid}
      name={network.name}
      current={this.props.current === network.uuid}
    />,
    network.honorNodes.length,
    <NetworkActions
      key={network.uuid}
      disabled={this.props.pending || this.props.current === network.uuid}
      onConnect={() => this.props.onConnect(network.uuid)}
      onRemove={preconfigured ? undefined : () => this.props.onRemove(network)}
    />
  ];

  render() {
    return (
      <Table
        bordered
        hover
        columns={[
          {
            title: this.props.intl.formatMessage({
              id: 'general.network.id.short',
              defaultMessage: 'ID'
            })
          },
          {
            title: this.props.intl.formatMessage({
              id: 'general.network.name',
              defaultMessage: 'Name'
            })
          },
          {
            title: this.props.intl.formatMessage({
              id: 'general.network.honor_nodes',
              defaultMessage: 'Nodes'
            })
          },
          {
            title: this.props.intl.formatMessage({
              id: 'general.network.actions',
              defaultMessage: 'Actions'
            })
          }
        ]}
        data={[
          ...this.props.preconfiguredNetworks.map((network) =>
            this.buildRow(network, true)
          ),
          ...this.props.networks.map((network) => this.buildRow(network))
        ]}
      />
    );
  }
}

export default injectIntl(NetworkListView);
