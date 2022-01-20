/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { StyledMenuItem } from './MenuItem';
import * as propTypes from 'prop-types';
import { TProtypoElement } from 'ibax/protypo';

export interface IMenuGroupProps {
  title?: string;
  icon?: string;
  params?: { [key: string]: any };
  childrenTree?: TProtypoElement[];
}

const MenuGroup: React.SFC<IMenuGroupProps> = (props, context) => (
  <StyledMenuItem>
    <a
      href="#"
      onClick={() =>
        context.menuPush({ name: props.title, content: props.childrenTree })
      }
    >
      <span className="link-body">
        {props.icon && <em className={`icon ${props.icon}`} />}
        <span>{props.title}</span>
      </span>
    </a>
  </StyledMenuItem>
);

MenuGroup.contextTypes = {
  menuPush: propTypes.func.isRequired
};

export default MenuGroup;
