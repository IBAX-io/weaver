/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TSessionRetryError } from 'modules/auth/util/sessionRetry';

export interface ISessionRetryProps {
  reason: TSessionRetryError;
  onRetry: () => void;
  onSignOut: () => void;
}

// A restored session the node could not be asked about yet: still signed in, asked for again
// meanwhile, and the user can ask now or sign out instead of waiting
const SessionRetry: React.FC<ISessionRetryProps> = (props) => (
  <div className="text-center" style={{ padding: 30 }} role="status">
    <i className="fa fa-chain-broken text-primary" style={{ fontSize: 128 }} />
    <h3>
      <FormattedMessage id={`auth.error.${props.reason}`} defaultMessage="Could not connect to the service" />
    </h3>
    <div className="text-muted">
      <FormattedMessage
        id="auth.session.retrying"
        defaultMessage="You are still signed in. Your account opens as soon as the node answers; trying again every few seconds."
      />
    </div>
    <div style={{ marginTop: 25 }}>
      <button type="button" className="btn btn-primary" onClick={props.onRetry}>
        <FormattedMessage id="auth.session.retry" defaultMessage="Try again now" />
      </button>
      <button type="button" className="btn btn-link" onClick={props.onSignOut}>
        <FormattedMessage id="general.wallet.signout" defaultMessage="Sign out" />
      </button>
    </div>
  </div>
);

export default SessionRetry;
