/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { IAccountContext } from 'ibax/auth';

import WalletList from 'containers/Auth/Login/WalletList';
import PasswordPrompt from 'containers/Auth/Login/PasswordPrompt';

export interface ILoginProps {
  wallet: IAccountContext;
  isAuthenticating: boolean;
}

const Login: React.SFC<ILoginProps> = (props) => (
  <div>
    <Switch>
      {props.wallet && props.wallet.wallet && props.isAuthenticating ? (
        <Route path="/" component={PasswordPrompt} />
      ) : null}
      <Route path="/" component={WalletList} />
    </Switch>
  </div>
);

export default Login;
