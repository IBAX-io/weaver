/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import DocumentTitle, { IDocumentTitleProps } from '.';

export interface ILocalizedDocumentTitleProps extends IDocumentTitleProps {
  defaultTitle?: string;
}

const LocalizedDocumentTitle: React.SFC<
  ILocalizedDocumentTitleProps & InjectedIntlProps
> = (props) => (
  <DocumentTitle
    title={props.intl.formatMessage({
      id: props.title,
      defaultMessage: props.defaultTitle || props.title
    })}
  >
    {props.children}
  </DocumentTitle>
);

export default injectIntl(LocalizedDocumentTitle);
