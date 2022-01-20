/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import { Button, Clearfix } from 'react-bootstrap';

export interface IAction {
  className?: string;
  icon: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action: React.ReactNode;
  onClick: () => void;
}

const Action: React.SFC<IAction> = (props) => (
  <Clearfix componentClass="div" className={props.className}>
    <div className="action-icon">
      <em className={classNames('text-primary', props.icon)} />
    </div>
    <h4>{props.title}</h4>
    <div>{props.description}</div>
    <div className="text-right">
      <Button bsStyle="link" onClick={props.onClick}>
        {props.action}
      </Button>
    </div>
  </Clearfix>
);

export default styled(Action)`
  .action-icon {
    float: left;
    width: 100px;
    font-size: 46px;
    vertical-align: top;
    text-align: center;
    padding: 10px;
    margin-right: 10px;
  }
`;
