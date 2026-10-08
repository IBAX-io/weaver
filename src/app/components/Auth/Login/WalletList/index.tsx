/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { IAccountContext, IWallet } from 'ibax/auth';
import { IAccount } from 'ibax/api';
import { INotificationsMessage } from 'ibax/socket';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import ContextButton from '../ContextButton';
import WalletButton from './WalletButton';
import Welcome from 'components/Auth/Welcome';
import { ILegacyWallet } from 'lib/crypto/legacyWallet';
import { formatAddress } from 'lib/crypto/address';
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
  onRemove: (wallet: IAccount) => any;
  onLogin: (params: { wallet: IAccount; password: string }) => any;
  onCopy: (wallet: IAccount) => any;
  onRegister: (wallet: IAccount) => any;
  onSelect: (params: IAccountContext) => any;
  onGuestLogin: () => any;
  // Saved by an earlier version: shown so they can be upgraded, never hidden away
  legacyWallets: ILegacyWallet[];
  // Stored entries that are not wallets of any known format; kept untouched
  damagedWallets: number;
  onUpgrade: (wallet: ILegacyWallet) => any;
  // Stored wallets not set up for this network's key algorithms yet
  walletsToEnable: IWallet[];
  onEnable: (wallet: IWallet) => any;
}

const legacyAddress = (wallet: ILegacyWallet) =>
  /^-?\d+$/.test(wallet.id) ? formatAddress(wallet.id) : wallet.id;

const WalletList: React.FC<IWalletListProps> = (props) => (
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
          className="desktop-flex-col desktop-flex-stretch"
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
          {props.walletsToEnable.length > 0 && (
            <section className="text-start mb-3" aria-labelledby="enable-wallets-title">
              <h2 id="enable-wallets-title" className="h6 mb-1">
                <FormattedMessage id="auth.network.title" defaultMessage="Accounts not set up for this network yet" />
              </h2>
              <p className="small mb-2">
                <FormattedMessage
                  id="auth.network.desc"
                  defaultMessage="This network uses other key algorithms, so each account has another address on it. Set each one up once with its password."
                />
              </p>
              {props.walletsToEnable.map(wallet => (
                <ContextButton
                  key={wallet.id}
                  icon="icon-key"
                  onClick={() => props.onEnable(wallet)}
                  description={
                    <FormattedMessage
                      id="auth.network.known"
                      defaultMessage="Address on IBAX mainnet and testnet: {address}"
                      values={{ address: <span className="font-monospace">{formatAddress(wallet.id)}</span> }}
                    />
                  }
                >
                  <FormattedMessage id="auth.network.enable" defaultMessage="Set up account for this network" />
                </ContextButton>
              ))}
            </section>
          )}
          {(props.legacyWallets.length > 0 || props.damagedWallets > 0) && (
            <section className="text-start mb-3" aria-labelledby="legacy-wallets-title">
              <h2 id="legacy-wallets-title" className="h6 mb-1">
                <FormattedMessage id="auth.legacy.title" defaultMessage="Accounts saved by an earlier version" />
              </h2>
              {props.legacyWallets.length > 0 && (
                <p className="small mb-2">
                  <FormattedMessage
                    id="auth.legacy.desc"
                    defaultMessage="Upgrade each one once with its password before using it."
                  />
                </p>
              )}
              {props.legacyWallets.map(wallet => (
                <ContextButton
                  key={wallet.encKey}
                  icon="icon-refresh"
                  onClick={() => props.onUpgrade(wallet)}
                  description={<span className="font-monospace">{legacyAddress(wallet)}</span>}
                >
                  <FormattedMessage id="auth.legacy.upgrade" defaultMessage="Upgrade account" />
                </ContextButton>
              ))}
              {props.damagedWallets > 0 && (
                <p className="small mb-0">
                  <FormattedMessage
                    id="auth.legacy.damaged"
                    defaultMessage="{count, plural, one {# stored account entry is} other {# stored account entries are}} damaged and cannot be used; they are kept unchanged in the app's data."
                    values={{ count: props.damagedWallets }}
                  />
                </p>
              )}
            </section>
          )}
          <div className="text-start">
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
