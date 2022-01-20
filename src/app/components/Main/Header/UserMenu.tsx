/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { IAccountContext } from 'ibax/auth';
import { IEcosystemInfo } from 'ibax/api';

import HeaderButton from './HeaderButton';
import Avatar from 'containers/Avatar';
import themed from 'components/Theme/themed';
import Item from 'components/Dropdown/Item';
import Heading from 'components/Dropdown/Heading';

const StyledUserMenu = themed.div`
    -webkit-app-region: no-drag;
    line-height: 0;
    display: inline-block;
    vertical-align: top;
    height: 40px;   
    padding: 0 0 0 10px !important;
    line-height: 18px;
    color: #fff;

    > .user-info {
        text-align: right;
        float: left;
        margin-right: 5px;
        white-space: nowrap;
        max-width: 170px;

        > .user-title {
            margin-top: 4px;
            font-size: 14px;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        > .user-subtitle {
            text-transform: uppercase;
            font-size: 13px;
            font-weight: 300;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    > .user-avatar {
        float: right;
        margin: 4px;
    }

    .user-dropdown {
        background: #fff;
        box-shadow: 0 0 25px rgba(0,0,0,.15);
        border-left: solid 1px #add1ff;
        border-bottom: solid 1px #add1ff;
    }
`;

interface Props {
  isDefaultWallet: boolean;
  wallet?: IAccountContext;
  walletEcosystems: IEcosystemInfo[];
  onSwitchEcosystem: (ecosystem: string, defaultRole?: boolean) => void;
  onLogout: () => void;
  onChangePassword: () => void;
  onBackup: () => void;
}

const UserMenu: React.SFC<Props> = (props) =>
  props.wallet &&
  props.wallet.wallet && (
    <HeaderButton
      align="right"
      menuWidth={216}
      content={
        <div>
          {!props.isDefaultWallet && (
            <>
              <Item onClick={props.onChangePassword} icon="icon-key text-muted">
                <FormattedMessage
                  id="general.wallet.changepassword"
                  defaultMessage="Change password"
                />
              </Item>
              <Item onClick={props.onBackup} icon="icon-shield text-muted">
                <FormattedMessage
                  id="general.wallet.backup"
                  defaultMessage="Backup account"
                />
              </Item>
            </>
          )}
          <Item onClick={props.onLogout} icon="icon-logout text-danger">
            <FormattedMessage
              id="general.wallet.signout"
              defaultMessage="Sign out"
            />
          </Item>
          <Heading>
            <FormattedMessage
              id="general.ecosystems"
              defaultMessage="Ecosystems"
            />
          </Heading>
          {props.walletEcosystems.map((value) => (
            <Item
              key={value.ecosystem}
              onClick={() =>
                props.onSwitchEcosystem(value.ecosystem, !value.roles.length)
              }
            >
              {value.name ? (
                value.name
              ) : (
                <FormattedMessage
                  id="general.wallet.ecosystemNo"
                  defaultMessage="Ecosystem #{ecosystem}"
                  values={{ ecosystem: value.ecosystem }}
                />
              )}
            </Item>
          ))}
        </div>
      }
    >
      <StyledUserMenu>
        <div className="user-info">
          <div className="user-title">
            {props.isDefaultWallet ? (
              <FormattedMessage id="auth.login.guest" defaultMessage="Demo" />
            ) : (
              <span>{props.wallet.wallet.address}</span>
            )}
          </div>
          <div className="user-subtitle">
            {props.wallet.access.name || (
              <FormattedMessage
                id="general.wallet.ecosystemNo"
                defaultMessage="Ecosystem #{ecosystem}"
                values={{ ecosystem: props.wallet.access.ecosystem }}
              />
            )}
          </div>
        </div>
        <Avatar
          className="user-avatar"
          size={32}
          account={props.wallet.wallet.address}
          ecosystem={props.wallet.access.ecosystem}
        />
      </StyledUserMenu>
    </HeaderButton>
  );

export default UserMenu;
