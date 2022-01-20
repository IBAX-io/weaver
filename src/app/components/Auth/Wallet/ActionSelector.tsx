/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import Action from './Action';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';

export interface IActionSelectorProps {
  onImport: () => void;
  onCreate: () => void;
}

const ActionSelector: React.SFC<IActionSelectorProps> = (props) => (
  <LocalizedDocumentTitle title="auth.wallet" defaultTitle="Wallet">
    <div>
      <HeadingNetwork returnUrl="/">
        <FormattedMessage
          id="auth.wallet.actions"
          defaultMessage="Account actions"
        />
      </HeadingNetwork>
      <div className="text-left">
        <Action
          icon="icon-wallet"
          title={
            <FormattedMessage id="auth.havekey" defaultMessage="I have a key" />
          }
          description={
            <FormattedMessage
              id="auth.havekey.desc"
              defaultMessage="If you are already familiar with Ibax and have a backup of your private key, choose this option to guide you through the process of restoring your account data"
            />
          }
          action={
            <FormattedMessage
              id="auth.import.existing"
              defaultMessage="Import existing key"
            />
          }
          onClick={props.onImport}
        />
        <hr />
        <Action
          icon="icon-lock"
          title={
            <FormattedMessage
              id="auth.nokey"
              defaultMessage="I don't have a key"
            />
          }
          description={
            <FormattedMessage
              id="auth.nokey.desc"
              defaultMessage="If you are new to the system or just want to create a new account, choose this option to generate a new private key and protect it with your password"
            />
          }
          action={
            <FormattedMessage
              id="auth.generate.new"
              defaultMessage="Generate new key"
            />
          }
          onClick={props.onCreate}
        />
      </div>
    </div>
  </LocalizedDocumentTitle>
);

export default ActionSelector;
