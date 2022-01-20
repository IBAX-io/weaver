/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import PageLink from 'containers/Routing/PageLink';
import themed from 'components/Theme/themed';
import { FormattedMessage } from 'react-intl';

interface Props {
  home?: boolean;
  active?: boolean;
  section: string;
  page: string;
  params: {
    [key: string]: string;
  };
}

const StyledBreadcrumb = themed.div`
    vertical-align: top;
    display: inline-block;

    &.breadcrumb_active {
        .breadcrumb__label, .breadcrumb__icon {
            color: ${(props) => props.theme.toolbarForegroundPrimary};
        }
    }

    .breadcrumb__icon {
        line-height: inherit;
        font-size: 16px;
        color: ${(props) => props.theme.toolbarForeground};
    }

    .breadcrumb__label {
        line-height: inherit;
        font-size: 14px;
        color: ${(props) => props.theme.toolbarForeground};
    }
`;

const placeholder = (
  <FormattedMessage id="navigation.loaded_page" defaultMessage="Loaded page" />
);

const Breadcrumb: React.SFC<Props> = (props) => {
  const titleText = props.children || placeholder;
  const title = props.home ? (
    <em className="breadcrumb__icon fa fa-home" />
  ) : (
    <span className="breadcrumb__label">{titleText}</span>
  );

  if (!props.active) {
    return <StyledBreadcrumb>{title}</StyledBreadcrumb>;
  }

  return (
    <StyledBreadcrumb className="breadcrumb_active">
      <PageLink section={props.section} page={props.page} params={props.params}>
        {title}
      </PageLink>
    </StyledBreadcrumb>
  );
};

export default Breadcrumb;
