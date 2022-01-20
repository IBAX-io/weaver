/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import Center from 'components/Center';

export interface IErrorProps {
  error: string;
}

const Error: React.SFC<IErrorProps> = (props) => (
  <LocalizedDocumentTitle title="general.error" defaultTitle="Error">
    <Center>
      <div className="text-muted">
        <div className="text-center mb-xl">
          <div className="text-lg mb-lg">500</div>
          <p className="lead m0">
            <FormattedMessage id="general.error" defaultMessage="Error" />
          </p>
          <div>
            <div>
              <FormattedMessage
                id="general.error.page"
                defaultMessage="The page you are looking for could not be processed"
              />
            </div>
            <div>{props.error}</div>
          </div>
        </div>
      </div>
    </Center>
  </LocalizedDocumentTitle>
);

export default Error;
