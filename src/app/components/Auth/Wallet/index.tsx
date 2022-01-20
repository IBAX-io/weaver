/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Switch, Route } from 'react-router';

import ActionSelector from 'containers/Auth/Wallet/ActionSelector';
import Create from 'containers/Auth/Wallet/Create';
import Import from 'containers/Auth/Wallet/Import';

const Wallet: React.SFC = (props) => (
  <Switch>
    <Route path="/account/create" component={Create} />
    <Route path="/account/import" component={Import} />
    <Route path="/account" component={ActionSelector} />
  </Switch>
);

export default Wallet;
