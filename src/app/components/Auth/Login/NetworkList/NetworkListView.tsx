/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
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

const NetworkActions: React.FC<INetworkActionsProps> = (props) => (
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

const NetworkName: React.FC<{ name: string; current: boolean }> = (props) => (
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

const NetworkListView: React.FC<INetworkListViewProps> = (props) => {
  const intl = useIntl();

  const buildRow = (network: INetwork, preconfigured?: boolean) => [
    <b key={network.uuid} style={{ whiteSpace: 'nowrap' }}>
      {network.id}
    </b>,
    <NetworkName
      key={network.uuid}
      name={network.name}
      current={props.current === network.uuid}
    />,
    network.honorNodes.length,
    <NetworkActions
      key={network.uuid}
      disabled={props.pending || props.current === network.uuid}
      onConnect={() => props.onConnect(network.uuid)}
      onRemove={preconfigured ? undefined : () => props.onRemove(network)}
    />
  ];

  return (
    <Table
      bordered
      hover
      columns={[
        {
          title: intl.formatMessage({
            id: 'general.network.id.short',
            defaultMessage: 'ID'
          })
        },
        {
          title: intl.formatMessage({
            id: 'general.network.name',
            defaultMessage: 'Name'
          })
        },
        {
          title: intl.formatMessage({
            id: 'general.network.honor_nodes',
            defaultMessage: 'Nodes'
          })
        },
        {
          title: intl.formatMessage({
            id: 'general.network.actions',
            defaultMessage: 'Actions'
          })
        }
      ]}
      data={[
        ...props.preconfiguredNetworks.map((network) => buildRow(network, true)),
        ...props.networks.map((network) => buildRow(network))
      ]}
    />
  );
};

export default NetworkListView;
