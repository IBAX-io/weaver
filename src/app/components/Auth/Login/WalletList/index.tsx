/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { IAccountContext, IWallet } from 'ibax/auth';
import { E_TOKENEXPIRED, ISignOutReason } from 'modules/auth/actions';
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
  // Why the app signed the user out of this network: its key algorithms changed, or the node no
  // longer took the session's token; found with the session ('session') or when the node refused
  // transactions ('send')
  signOutNotice: ISignOutReason | null;
  onEnable: (wallet: IWallet) => any;
  // The network runs in FIPS 140-3 mode: only accounts with a key in a PKCS#11 module are listed;
  // `desktop`: the app can reach a module (the web app cannot sign for such a network)
  fipsMode: { desktop: boolean } | null;
}

// A titled group of accounts that need something done before they can be used
const AccountSection: React.FC<{ id: string, title: React.ReactNode, desc?: React.ReactNode, children: React.ReactNode }> = props => (
  <section className="text-start mb-3" aria-labelledby={props.id}>
    <h2 id={props.id} className="h6 mb-1" tabIndex={-1}>{props.title}</h2>
    {props.desc && <p className="small mb-2">{props.desc}</p>}
    {props.children}
  </section>
);

const SignOutNotice: React.FC<{ notice: ISignOutReason }> = ({ notice }) => {
  if (E_TOKENEXPIRED === notice.reason) {
    return 'send' === notice.during ? (
      <FormattedMessage
        id="auth.signedOut.expired.send"
        defaultMessage="You were signed out: the node no longer accepts your session (it expired, or the node was restarted), so it refused your transactions, and those not sent yet were cancelled. Sign in again."
      />
    ) : (
      <FormattedMessage
        id="auth.signedOut.expired.session"
        defaultMessage="You were signed out: the node no longer accepts your session (it expired, or the node was restarted). Sign in again."
      />
    );
  }
  return 'send' === notice.during ? (
    <FormattedMessage
      id="auth.signedOut.send"
      defaultMessage="You were signed out: this network now uses other key algorithms, so the node refused your transactions, and those not sent yet were cancelled. Your account has another address on it: sign in again, after setting the account up below if it is listed there."
    />
  ) : (
    <FormattedMessage
      id="auth.signedOut.session"
      defaultMessage="You were signed out: this network now uses other key algorithms, so your account has another address on it. Sign in again, after setting the account up below if it is listed there."
    />
  );
};

const legacyAddress = (wallet: ILegacyWallet) =>
  /^-?\d+$/.test(wallet.id) ? formatAddress(wallet.id) : wallet.id;

const ENABLE_TITLE = 'enable-wallets-title';
const LEGACY_TITLE = 'legacy-wallets-title';

// An account set up for the network, or upgraded, leaves its list, and its button the focus: the
// focus goes to the heading of that list, or, with the list gone, to the first button of the page
const useFocusAfterSetUp = (waiting: { [title: string]: number }) => {
  const page = useRef<HTMLDivElement>(null);
  const before = useRef(waiting);
  const counts = Object.values(waiting).join();
  useEffect(() => {
    const left = Object.keys(waiting).find(title => waiting[title] < (before.current[title] || 0));
    before.current = waiting;
    const lost = !document.activeElement || document.activeElement === document.body;
    if (left && lost && page.current) {
      const target = page.current.querySelector<HTMLElement>(`#${left}`) || page.current.querySelector<HTMLElement>('button');
      if (target) {
        target.focus();
      }
    }
  // Only the counts matter, not the object holding them
  }, [counts]);
  return page;
};

const WalletList: React.FC<IWalletListProps> = (props) => {
  const page = useFocusAfterSetUp({ [ENABLE_TITLE]: props.walletsToEnable.length, [LEGACY_TITLE]: props.legacyWallets.length });
  return (
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
          ref={page}
        >
          {props.fipsMode && (
            <div className="alert alert-info text-start">
              {props.fipsMode.desktop ? (
                <FormattedMessage
                  id="auth.fips.desktop"
                  defaultMessage="This network runs in FIPS 140-3 mode: only keys in a hardware token (PKCS#11) sign for it, so only accounts with such a key are listed. Add one with Create or import account."
                />
              ) : (
                <FormattedMessage
                  id="auth.fips.web"
                  defaultMessage="This network runs in FIPS 140-3 mode: only keys in a hardware token sign for it, and only the desktop app can use one. Here you can read the network but not sign in to it."
                />
              )}
            </div>
          )}
          {props.signOutNotice && (
            // Shown with the page: an alert is read out, a polite region filled from the start is not
            <div className="alert alert-warning text-start" role="alert">
              <SignOutNotice notice={props.signOutNotice} />
            </div>
          )}
          <div className="text-center desktop-flex-stretch">
            {/* The welcome is for one without accounts: one whose accounts wait for a set-up has some */}
            {0 === props.wallets.length && 0 === props.walletsToEnable.length && 0 === props.legacyWallets.length ? (
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
            <AccountSection
              id={ENABLE_TITLE}
              title={<FormattedMessage id="auth.network.title" defaultMessage="Accounts not set up for this network yet" />}
              desc={
                <FormattedMessage
                  id="auth.network.desc"
                  defaultMessage="Your accounts are still here. This network uses other key algorithms, so each account has another address on it: set each one up once with its password."
                />
              }
            >
              {props.walletsToEnable.map(wallet => (
                <ContextButton
                  key={wallet.id}
                  icon="icon-key"
                  onClick={() => props.onEnable(wallet)}
                  description={
                    <FormattedMessage
                      id="auth.network.known"
                      defaultMessage="Its address under the default key algorithms: {address}"
                      values={{ address: <span className="font-monospace">{formatAddress(wallet.id)}</span> }}
                    />
                  }
                >
                  <FormattedMessage id="auth.network.enable" defaultMessage="Set up account for this network" />
                </ContextButton>
              ))}
            </AccountSection>
          )}
          {(props.legacyWallets.length > 0 || props.damagedWallets > 0) && (
            <AccountSection
              id={LEGACY_TITLE}
              title={<FormattedMessage id="auth.legacy.title" defaultMessage="Accounts saved by an earlier version" />}
              desc={props.legacyWallets.length > 0 && (
                <FormattedMessage
                  id="auth.legacy.desc"
                  defaultMessage="Upgrade each one once with its password before using it."
                />
              )}
            >
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
            </AccountSection>
          )}
          <div className="text-start">
            {/* No account the web app could make signs for a FIPS network */}
            {!(props.fipsMode && !props.fipsMode.desktop) && <ContextButton
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
            </ContextButton>}
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
};

export default WalletList;
