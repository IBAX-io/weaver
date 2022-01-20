/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';

import themed from 'components/Theme/themed';

export interface IToolButtonProps {
  title?: string;
  icon?: string;
  page?: string;
  pageparams?: {
    [name: string]: string;
  };
  onClick: (e: any) => void;
}

const StyledToolButton = themed.button`
    border: 0;
    background: 0;
    outline: 0;
    border: 0;
    height: 35px;
    line-height: 35px;
    white-space: nowrap;
    padding: 0 10px;
    transition: background ease-in-out .12s;

    &:hover {
        background: rgba(0,0,0,0.05);
    }
    
    .toolbutton__icon {
        font-size: 16px;
        color: #515151;
        margin-right: 8px;
    }
    
    .toolbutton__label {
        vertical-align: top;
        white-space: nowrap;
        font-size: 15px;
        color: #244134;
    }
`;

const ToolButton: React.SFC<IToolButtonProps> = (props) => {
  return (
    <StyledToolButton onClick={props.onClick}>
      <em className={classNames('toolbutton__icon', props.icon)} />
      <span className="toolbutton__label">{props.title}</span>
    </StyledToolButton>
  );
};

export default ToolButton;
