/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';
import classNames from 'classnames';
import propTypes from 'prop-types';

const StyledItem = themed.button`
    border-radius: 0;
    outline: 0;
    border: 0;
    background: 0;
    transition: background .15s;
    width: 100%;
    padding: 0 12px;
    margin: 0;
    height: 40px;
    line-height: 40px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    color: ${(props) => props.theme.dropdownMenuForeground};
    cursor: pointer;
    display: block;
    text-align: left;
    border: dashed 1px transparent;
    position: relative;
    white-space: nowrap;

    &.item_hasicon {
        padding-left: 40px;
    }

    > .item__icon {
        position: absolute;
        left: 12px;
        top: 0;
        bottom: 0;

        > em {
            font-weight: 500;
            font-size: 15px;
            line-height: 40px;
            margin-right: 12px;
        }
    }

    &[disabled] {
        color: ${(props) => props.theme.dropdownMenuDisabled};
    }

    &:hover {
        background: ${(props) => props.theme.dropdownMenuActive};
    }

    &:focus {
        border-color: #84baff;
    }
`;

interface Props {
  icon?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Item: React.SFC<Props> = (props, context) => {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    context.closeDropdown();
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <StyledItem
      disabled={props.disabled}
      onClick={handleClick}
      className={classNames({ item_hasicon: !!props.icon })}
    >
      {props.icon && (
        <div className="item__icon">
          <em className={props.icon} />
        </div>
      )}
      <div>{props.children}</div>
    </StyledItem>
  );
};

Item.contextTypes = {
  closeDropdown: propTypes.func.isRequired
};

export default Item;
