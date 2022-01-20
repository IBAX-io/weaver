/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import NetworkError from 'services/network/errors';

export interface IErrorProps {
  error: NetworkError;
}

const Error: React.SFC<IErrorProps> = (props) => (
  <div className="text-center mv-lg">
    <h1 className="mb-lg">
      <sup>
        <em className="fa fa-cog fa-2x text-muted fa-spin text-info" />
      </sup>
      <em className="fa fa-cog fa-5x text-muted fa-spin text-purple" />
      <em className="fa fa-cog fa-lg text-muted fa-spin text-success" />
    </h1>
    <div className="text-bold text-lg mb-lg">
      <FormattedMessage
        id={`general.network.error.${props.error}`}
        defaultMessage="Network is unreachable"
      />
    </div>
  </div>
);

export default Error;
