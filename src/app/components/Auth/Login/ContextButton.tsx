/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';

export interface IContextButtonProps {
  className?: string;
  icon: string;
  description: React.ReactNode;
  onClick: () => void;
}

const ContextButton: React.SFC<IContextButtonProps> = (props) => (
  <button className={props.className} onClick={props.onClick}>
    <div className="button-icon">
      <em className={props.icon} />
    </div>
    <div>
      <div className="button-label">{props.children}</div>
      <div className="button-desc">{props.description}</div>
    </div>
  </button>
);

export default styled(ContextButton)`
  display: block;
  width: 100%;
  height: 40px;
  color: #244134;
  border: 0;
  background: 0;
  padding: 0;
  margin: 10px 0 15px 0;
  text-align: left;

  &:hover {
    color: #27c24c;
  }

  .button-icon {
    vertical-align: top;
    text-align: center;
    float: left;
    width: 40px;
    height: 40px;
    line-height: 40px;
    font-size: 22px;
    margin-right: 5px;
  }

  .button-label {
    font-size: 16px;
  }

  .button-desc {
    color: #909fa7;
  }
`;
