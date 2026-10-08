/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';
import { StyledMenuItem } from './MenuItem';
import { TProtypoElement } from 'ibax/protypo';
import { ProtypoContext } from '../ProtypoContext';

export interface IMenuGroupProps {
  title?: string;
  icon?: string;
  params?: { [key: string]: any };
  childrenTree?: TProtypoElement[];
}

const MenuGroup: React.FC<React.PropsWithChildren<IMenuGroupProps>> = props => {
  const context = useContext(ProtypoContext);

  return (
    <StyledMenuItem>
      <a
        href="#"
        onClick={() =>
          context.menuPush({
            section: context.section,
            menu: { name: props.title, content: props.childrenTree }
          })
        }
      >
        <span className="link-body">
          {props.icon && <em className={`icon ${props.icon}`} />}
          <span>{props.title}</span>
        </span>
      </a>
    </StyledMenuItem>
  );
};

export default MenuGroup;
