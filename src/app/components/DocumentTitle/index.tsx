/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import NativeDocumentTitle from 'react-document-title';

export interface IDocumentTitleProps {
  title: string;
}

const DocumentTitle: React.SFC<IDocumentTitleProps & InjectedIntlProps> = (
  props
) => {
  const title = props.title
    ? props.intl.formatMessage(
        {
          id: 'general.title.format',
          defaultMessage: '{title} | Ibax'
        },
        { title: props.title }
      )
    : props.intl.formatMessage({
        id: 'general.title',
        defaultMessage: 'Ibax'
      });

  return (
    <NativeDocumentTitle title={title}>{props.children}</NativeDocumentTitle>
  );
};

export default injectIntl(DocumentTitle);
