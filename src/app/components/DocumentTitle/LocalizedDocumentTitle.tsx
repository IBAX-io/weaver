/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { useIntl } from 'react-intl';
import DocumentTitle, { IDocumentTitleProps } from '.';

export interface ILocalizedDocumentTitleProps extends IDocumentTitleProps {
  defaultTitle?: string;
}

const LocalizedDocumentTitle: React.FC<React.PropsWithChildren<ILocalizedDocumentTitleProps>> = (props) => {
  const intl = useIntl();
  return (
    <DocumentTitle
      title={intl.formatMessage({
        id: props.title,
        defaultMessage: props.defaultTitle || props.title
      })}
    >
      {props.children}
    </DocumentTitle>
  );
};

export default LocalizedDocumentTitle;
