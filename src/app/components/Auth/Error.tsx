/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

export interface IErrorProps {
  type: string;
  message: string;
}

const Error: React.SFC<IErrorProps> = (props) => (
  <div>
    <h4>FATAL_ERROR: {props.type}</h4>
    <div>{props.message}</div>
  </div>
);

export default Error;
