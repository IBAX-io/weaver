/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';

export interface IWelcomeProps {}

const Welcome: React.SFC<IWelcomeProps> = (props) => (
  <div>
    <h4 className="p0 m0">
      <FormattedMessage id="auth.welcome" defaultMessage="Welcome" />
    </h4>
    <p className="pv">
      <FormattedMessage
        id="auth.welcome.guide"
        defaultMessage="Before proceeding, you will be guided through the account creation process. This will not take too much time. After completing this process you will be able to use all features of Ibax"
      />
    </p>
    <p>
      <FormattedMessage
        id="auth.welcome.continue"
        defaultMessage="Press 'Get started' button to begin the process of creating or restoring your account"
      />
    </p>
    <hr />
  </div>
);

export default Welcome;
