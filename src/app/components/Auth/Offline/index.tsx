/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import NetworkError from 'services/network/errors';

import Error from './Error';

export interface IOfflineProps {
  error: NetworkError;
}

const Offline: React.SFC<IOfflineProps> = (props) => (
  <div>
    {props.error && <Error error={props.error} />}
    {!props.error && (
      <div style={{ padding: 30 }}>
        <i
          className="fa fa-chain-broken text-primary"
          style={{ fontSize: 128 }}
        />
        <h3>
          <FormattedMessage
            id="general.network.notconnected"
            defaultMessage="Not connected"
          />
        </h3>
        <div className="text-muted">
          <FormattedMessage
            id="general.network.notconnected.desc"
            defaultMessage="Please connect to a network to begin using Ibax. You can manage networks by clicking on the connection indicator in the top right corner of this window"
          />
        </div>
        <div style={{ marginTop: 25 }}>
          <Link to="/networks" className="btn btn-primary">
            <FormattedMessage
              id="general.network.connect"
              defaultMessage="Connect"
            />
          </Link>
        </div>
      </div>
    )}
  </div>
);

export default Offline;
