/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import themed from 'components/Theme/themed';
import DropdownAnimation from 'components/Animation/Dropdown';

const StyledDropdown = themed.div`
    display: inline-block;
    position: relative;
    line-height: normal;
    background: ${(props) => props.theme.dropdownMenuBackground};
    box-shadow: 0 0 15px rgba(0,0,0,.15);
    border-radius: 4px;
    border-top: none;
    text-align: left;
    overflow: hidden;
`;

interface Props {
  className?: string;
  active?: boolean;
  align?: 'left' | 'right';
  width?: number;
}

const Dropdown: React.SFC<Props> = (props) => (
  <DropdownAnimation visible={props.active} align={props.align}>
    <StyledDropdown
      className={props.active ? 'dropdown-active' : ''}
      style={{ width: props.width ? `${props.width}px` : 'auto' }}
    >
      {props.children}
    </StyledDropdown>
  </DropdownAnimation>
);

export default Dropdown;
