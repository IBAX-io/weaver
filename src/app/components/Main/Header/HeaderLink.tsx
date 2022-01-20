/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

import themed from 'components/Theme/themed';

const StyledHeaderLink = themed(Link)`
    position: relative;
    border-radius: 0;
    padding: 9px 0 2px 0;
    outline: 0;
    border: 0;
    background: 0;
    color: ${(props) => props.theme.menubarForeground};
    font-size: 15px;
    font-weight: 600;
    transition: background .15s;
    display: inline-block;
    border-bottom: solid 2px transparent;
    line-height: normal;
    text-align: center;
    transition: color ease-in-out .12s;

    && {
        text-decoration: none;
    }

    &:hover {
        color: ${(props) => props.theme.menubarForegroundActive};
    }

    &.active {
        border-bottom-color: ${(props) => props.theme.menubarBackgroundActive};
        color: ${(props) => props.theme.menubarForegroundActive};
    }
`;

interface Props {
  to: string;
  active?: boolean;
}

const HeaderLink: React.SFC<Props> = (props) => (
  <StyledHeaderLink
    className={classNames({ active: props.active })}
    to={props.to}
  >
    {props.children}
  </StyledHeaderLink>
);

export default HeaderLink;
