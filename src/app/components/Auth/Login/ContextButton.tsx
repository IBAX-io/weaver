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

const ContextButton: React.FC<React.PropsWithChildren<IContextButtonProps>> = (props) => (
  <button className={props.className} onClick={props.onClick}>
    <div className="button-icon">
      <em className={props.icon} />
    </div>
    <div className="button-text">
      <div className="button-label">{props.children}</div>
      <div className="button-desc">{props.description}</div>
    </div>
  </button>
);

export default styled(ContextButton)`
  display: flex;
  align-items: flex-start;
  width: 100%;
  /* At least the icon's height; a description that wraps makes it taller */
  min-height: 40px;
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
    flex: none;
    text-align: center;
    width: 40px;
    height: 40px;
    line-height: 40px;
    font-size: 22px;
    margin-right: 5px;
  }

  /* The text beside the icon wraps (an address has no spaces to wrap at) */
  .button-text {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .button-label {
    font-size: 16px;
  }

  /* The theme's body color: the grey it had (#909fa7, 2.73:1 on white) could not be read, and it
     is what tells accounts apart */
  .button-desc {
    color: ${props => props.theme.contentForeground};
  }
`;
