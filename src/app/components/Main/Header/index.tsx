/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';

import themed from 'components/Theme/themed';
import HeaderIndicator from './HeaderIndicator';
import NotificationsMenu from 'containers/Main/Header/NotificationsMenu';
import UserMenu from 'containers/Main/Header/UserMenu';
import imgLogo from 'images/logo.png';
import Selector from 'containers/Main/Navigator/Sections/Selector';
import HeaderSpacer from './HeaderSpacer';
import HeaderLink from './HeaderLink';
import LangMenu from 'containers/Main/Header/LangMenu';

interface Props {
  app?: string;
  page?: string;
  isAuthorized: boolean;
}

const StyledHeader = themed.header`
    background: ${(props) => props.theme.menubarBackground};
    height: 40px;
    color: ${(props) => props.theme.menubarForeground};
    transition: width .32s ease-in-out;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 8000;
    display: flex;
    flex-direction: row;
    padding-left: 18px;
    align-items: center;
    .header__filler {
        flex: 1;
    }
    /* Only the section breadcrumb gives way, so the menus on the right stay reachable */
    > * {
        flex-shrink: 0;
    }
    > .header__sections {
        display: flex;
        align-items: center;
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
    }
    @media (max-width: 575.98px) {
        padding-left: 8px;
        .header-logo,
        .header-logo + em {
            display: none;
        }
    }
    .header-logo{
      width:40px;
      height:30px;
      background:url(${imgLogo}) no-repeat center;
      background-size:100% 100%;
    }
`;

const Header: React.FC<Props> = (props) => (
  <StyledHeader>
    <div className="header__sections">
      <div className="header-logo" />
      <HeaderSpacer />
      <Selector section={props.app === 'browse' ? props.page : null} />
    </div>
    <HeaderSpacer />
    <HeaderLink to="/editor" active={'editor' === props.app}>
      <FormattedMessage id="editor" defaultMessage="Editor" />
    </HeaderLink>
    <HeaderSpacer />
    <HeaderLink to="/wallet" active={'wallet' === props.app}>
      <FormattedMessage id="wallet" defaultMessage="Wallet" />
    </HeaderLink>
    <div className="header__filler" />

    {props.isAuthorized && (
      <HeaderIndicator
        right
        icon="icon-key"
        title={
          <FormattedMessage id="privileged" defaultMessage="Privileged mode" />
        }
        titleDesc={
          <FormattedMessage
            id="privileged.desc"
            defaultMessage="You will not be prompted to enter your password when executing transactions"
          />
        }
      />
    )}

    <LangMenu />

    <NotificationsMenu />
    <UserMenu />
  </StyledHeader>
);

export default Header;
