/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';

const PanelDiv = styled.div`
  .b-panel__header {
    position: relative;
    height: 34px;
    background-color: #3a4653;
    padding-left: 20px;
  }

  .b-panel__header__text {
    line-height: 34px;
    font-size: 14px;
    font-family: 'Avenir-Book', 'Source Sans Pro', sans-serif;
    text-transform: uppercase;
    color: #707c91;
  }

  .b-panel__header__toggle {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 3px;
    background-color: #dcdfe2;
    cursor: pointer;
  }

  .b-panel__body {
    background-color: #465669;
    min-height: 100px;
  }

  .b-position-bullet {
    display: inline-block;
    position: relative;
    width: 11px;
    height: 11px;
    border-radius: 2px;
    border: 1px solid #9aa7b3;
    margin-left: 1px;
    margin-right: 1px;
    cursor: pointer;
  }

  .b-position-bullet_selected {
    border-color: #62b2fc;
    background-color: #62b2fc;
  }

  .b-position-bullet_selected:after {
    position: absolute;
    top: 50%;
    left: 50%;
    content: '';
    display: block;
    width: 4px;
    height: 4px;
    margin-left: -2px;
    margin-top: -2px;
    background-color: #fff;
    border-radius: 2px;
  }
`;

interface IConstructorPanelProps {
  title: string;
}

const ConstructorPanel: React.SFC<IConstructorPanelProps> = (props) => (
  <PanelDiv>
    <div className="b-panel__header">
      <div className="b-panel__header__text">{props.title}</div>
      <div className="b-panel__header__toggle" />
    </div>
    <div className="b-panel__body">{props.children}</div>
  </PanelDiv>
);

export default ConstructorPanel;
