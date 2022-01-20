/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import Center from 'components/Center';

const NotFound: React.SFC = (props) => (
  <LocalizedDocumentTitle title="general.error" defaultTitle="Error">
    <Center>
      <div className="text-muted">
        <div className="text-center mb-xl">
          <div className="text-lg mb-lg">404</div>
          <p className="lead m0">
            <FormattedMessage id="general.error" defaultMessage="Error" />
          </p>
          <p>
            <FormattedMessage
              id="general.error.notfound"
              defaultMessage="The page you are looking for does not exist"
            />
          </p>
        </div>
      </div>
    </Center>
  </LocalizedDocumentTitle>
);

export default NotFound;
