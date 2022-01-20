/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { IWallet, IAccountContext } from 'ibax/auth';
import { IAccount } from 'ibax/api';
import { INotificationsMessage } from 'ibax/socket';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import ContextButton from '../ContextButton';
import WalletButton from './WalletButton';
import Welcome from 'components/Auth/Welcome';
import Offline from 'containers/Auth/Offline';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';

export interface IWalletListProps {
  className?: string;
  pending: boolean;
  isOffline: boolean;
  wallets: IAccount[];
  notifications: INotificationsMessage[];
  activationEnabled: boolean;
  demoModeEnabled?: boolean;
  onCreate: () => any;
  onRemove: (wallet: IWallet) => any;
  onLogin: (params: { wallet: IWallet; password: string }) => any;
  onCopy: (wallet: IWallet) => any;
  onRegister: (wallet: IWallet) => any;
  onSelect: (params: IAccountContext) => any;
  onGuestLogin: () => any;
}

const WalletList: React.SFC<IWalletListProps> = (props) => (
  <LocalizedDocumentTitle title="auth.login" defaultTitle="Login">
    <div
      className={classNames(
        'desktop-flex-col desktop-flex-stretch',
        props.className
      )}
    >
      <HeadingNetwork>
        <FormattedMessage id="auth" defaultMessage="Authorization" />
      </HeadingNetwork>
      {props.isOffline ? (
        <Offline />
      ) : (
        <div
          className="form-horizontal desktop-flex-col desktop-flex-stretch"
          style={{ padding: 10 }}
        >
          <div className="text-center desktop-flex-stretch">
            {0 === props.wallets.length ? (
              <Welcome />
            ) : (
              props.wallets.map((wallet, index) => (
                <WalletButton
                  key={wallet.id}
                  wallet={wallet}
                  notifications={props.notifications.filter(
                    (l) => l.id === wallet.id
                  )}
                  onRemove={() => props.onRemove(wallet)}
                  onCopy={() => props.onCopy(wallet)}
                  onRegister={
                    props.activationEnabled
                      ? () => props.onRegister(wallet)
                      : null
                  }
                  onSelect={(params) => props.onSelect({ ...params, wallet })}
                />
              ))
            )}
          </div>
          <div className="text-left">
            <ContextButton
              icon="icon-plus"
              onClick={props.onCreate}
              description={
                <FormattedMessage
                  id="wallet.createimport.desc"
                  defaultMessage="Restore your existing account or enroll a new one"
                />
              }
            >
              <FormattedMessage
                id="wallet.createimport"
                defaultMessage="Create or import account"
              />
            </ContextButton>
            {props.demoModeEnabled && (
              <ContextButton
                icon="icon-login"
                onClick={props.onGuestLogin}
                description={
                  <FormattedMessage
                    id="auth.login.guest.desc"
                    defaultMessage="Proceed with this option if you want to try Ibax in test mode"
                  />
                }
              >
                <FormattedMessage id="auth.login.guest" defaultMessage="Demo" />
              </ContextButton>
            )}
          </div>
        </div>
      )}
    </div>
  </LocalizedDocumentTitle>
);

export default WalletList;
