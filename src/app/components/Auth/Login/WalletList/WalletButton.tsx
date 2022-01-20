/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Button, Clearfix } from 'react-bootstrap';
import { IAccount, IRoleInfo, IEcosystemInfo } from 'ibax/api';
import { INotificationsMessage } from 'ibax/socket';

import Avatar from 'containers/Avatar';
import RoleButton from './RoleButton';

export interface IWalletButtonProps {
  className?: string;
  wallet: IAccount;
  notifications: INotificationsMessage[];
  onCopy: () => void;
  onRemove: () => void;
  onSelect: (params: { access: IEcosystemInfo; role: IRoleInfo }) => void;
  onRegister?: () => void;
}

const getNotificationsCount = (
  notifications: INotificationsMessage[],
  role: string,
  ecosystem: string
) => {
  const value = notifications.find(
    (l) => l.role === role && l.ecosystem === ecosystem
  );
  return value ? value.count : 0;
};

const WalletButton: React.SFC<IWalletButtonProps> = (props) => (
  <Clearfix componentClass="div" className={props.className}>
    <div className="wallet-icon">
      <em className="text-primary icon-wallet" />
    </div>
    <div className="wallet-head">
      <h4 className="wallet-name">
        {props.wallet.address ? (
          <span>{props.wallet.address}</span>
        ) : (
          <FormattedMessage
            id="auth.wallet.unregistered"
            defaultMessage="Unregistered account"
          />
        )}
      </h4>
      {0 === props.wallet.access.length && props.onRegister && (
        <div className="text-danger">
          <FormattedMessage
            id="auth.wallet.register.desc"
            defaultMessage="This account is pending registration. Click register to begin the process"
          />
        </div>
      )}
      <div>
        {0 === props.wallet.access.length && props.onRegister && (
          <Button
            className="btn-action"
            bsStyle="link"
            onClick={props.onRegister}
          >
            <FormattedMessage
              id="auth.wallet.register"
              defaultMessage="Register"
            />
          </Button>
        )}
        <Button className="btn-action" bsStyle="link" onClick={props.onCopy}>
          <FormattedMessage id="auth.wallet.share" defaultMessage="Share" />
        </Button>
        <Button className="btn-action" bsStyle="link" onClick={props.onRemove}>
          <FormattedMessage id="auth.wallet.remove" defaultMessage="Remove" />
        </Button>
      </div>
    </div>
    <div>
      {props.wallet.access.map((access) => (
        <div key={access.ecosystem} className="wallet-access">
          <div className="wallet-child media-box" key={access.ecosystem}>
            <div className="pull-left">
              <Avatar
                size={44}
                account={props.wallet.address}
                ecosystem={access.ecosystem}
              />
            </div>
            <div className="wallet-child-content media-box-body clearfix">
              <div>
                <div>
                  <b>
                    ({access.ecosystem}) {access.name && access.name}
                  </b>
                </div>
                <div>
                  <span>
                    <FormattedMessage
                      id="auth.login.as"
                      defaultMessage="Login with role"
                    />
                    :
                  </span>
                  <RoleButton
                    className="wallet-btn"
                    badge={getNotificationsCount(
                      props.notifications,
                      '0',
                      access.ecosystem
                    )}
                    onClick={() => props.onSelect({ access, role: null })}
                  >
                    <FormattedMessage
                      id="auth.role.guest"
                      defaultMessage="Guest"
                    />
                  </RoleButton>
                  {access.roles.map((role) => (
                    <RoleButton
                      key={role.id}
                      className="wallet-btn"
                      badge={getNotificationsCount(
                        props.notifications,
                        role.id,
                        access.ecosystem
                      )}
                      onClick={() => props.onSelect({ access, role })}
                    >
                      {role.name}
                    </RoleButton>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Clearfix>
);

export default styled(WalletButton)`
  text-align: initial;
  border-bottom: 1px solid #e4eaec;
  padding: 0 0 10px;
  position: relative;
  margin: 0 20px 0 20px;

  .wallet-head {
    margin-left: 60px;
  }

  .wallet-name {
    margin-bottom: 5px;
  }

  .wallet-icon {
    position: absolute;
    top: 5px;
    left: 0;
    height: 80px;
    font-size: 40px;
    vertical-align: top;
    text-align: center;
    margin-right: 20px;
  }

  .wallet-access {
    position: relative;
    margin-top: 10px;

    .wallet-child {
      margin-top: 0;
    }

    .wallet-child-content {
      padding-left: 5px;
    }
  }

  .wallet-btn {
    margin-left: 5px;
    margin-bottom: 5px;
  }

  .btn-action {
    padding: 0;
    margin-right: 10px;
  }
`;
