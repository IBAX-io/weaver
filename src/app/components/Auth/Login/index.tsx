/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { IAccountContext } from 'ibax/auth';

import WalletList from 'containers/Auth/Login/WalletList';
import PasswordPrompt from 'containers/Auth/Login/PasswordPrompt';

export interface ILoginProps {
  wallet: IAccountContext;
  isAuthenticating: boolean;
}

const Login: React.FC<ILoginProps> = (props) => (
  <div>
    {props.wallet && props.wallet.wallet && props.isAuthenticating ? (
      <PasswordPrompt />
    ) : (
      <WalletList />
    )}
  </div>
);

export default Login;
