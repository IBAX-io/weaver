/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

export interface IButtonProps {
  disabled?: boolean;
  pending?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Button: React.SFC<IButtonProps> = (props) => (
  <button
    type="button"
    onClick={props.onClick}
    disabled={props.disabled}
    className={props.className}
  >
    {props.children}
  </button>
);

export default Button;
