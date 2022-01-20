/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classnames from 'classnames';
import propTypes from 'prop-types';

import themed from 'components/Theme/themed';
import Protypo, { IParamsSpec } from '../Protypo';
import PageLink from 'containers/Routing/PageLink';

export interface IMenuItemProps {
  title?: string;
  page?: string;
  icon?: string;
  params?: IParamsSpec;
}

export const StyledMenuItem = themed.div`
    border-bottom: solid 1px ${(props) => props.theme.menuOutline};

    > a, > a:hover {
        text-decoration: none !important;
    }

    &.active {
        > .link-active-decorator {
            opacity: 1;
        }
    }

    > .link-active-decorator {
        display: block;
        opacity: 0;
        background: #4c7dbd;
        float: left;
        width: 4px;
        height: 50px;
        transition: opacity .2s ease-in-out;
    }

    &:hover {
        background: ${(props) => props.theme.menuBackgroundActive};
    }

    .link-body {
        display: block;
        height: 50px;
        line-height: 50px;
        padding: 0 18px;
        color: ${(props) => props.theme.menuForeground};
        font-size: 14px;
        font-weight: 400;
        text-align: left;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .fa {
            margin-right: 16px;
            color: ${(props) => props.theme.menuIconColor};
            font-size: 21px;
            vertical-align: middle;
        }
    }
`;

interface IMenuItemContext {
  section: string;
  protypo: Protypo;
}

const MenuItem: React.SFC<IMenuItemProps> = (
  props,
  context: IMenuItemContext
) => {
  const isActive = context.protypo.getCurrentPage() === props.page;
  const classes = classnames({
    active: isActive
  });

  return (
    <StyledMenuItem className={classes}>
      <PageLink
        page={props.page || ''}
        section={context.section}
        params={props.params ? context.protypo.resolveParams(props.params) : {}}
        from={
          context.protypo.props.menu
            ? {
                type: 'MENU',
                title: props.title,
                name: context.protypo.props.menu
              }
            : undefined
        }
      >
        <span className="link-active-decorator" />
        <span className="link-body">
          {props.icon && <em className={`fa ${props.icon}`} />}
          <span>{props.title}</span>
        </span>
      </PageLink>
    </StyledMenuItem>
  );
};

MenuItem.contextTypes = {
  section: propTypes.string.isRequired,
  protypo: propTypes.object.isRequired
};

export default MenuItem;
