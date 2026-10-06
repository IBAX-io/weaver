/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Link } from 'react-router';
import { generateRoute } from 'services/router';
import { TBreadcrumbType } from 'ibax/content';

export interface IPageLinkProps {
    className?: string;
    section: string;
    page: string;
    params?: {
        [key: string]: string
    };
    from?: {
        name: string;
        title?: string;
        type: TBreadcrumbType;
    };
}

// Router location state attached by PageLink
export interface IPageLinkState {
    from?: IPageLinkProps['from'];
}

export const isPageLinkState = (state: unknown): state is IPageLinkState =>
    !!state && 'object' === typeof state && 'from' in state;

const PageLink: React.FC<React.PropsWithChildren<IPageLinkProps>> = props => (
    <Link
        to={generateRoute(`/browse/${props.section}/${props.page}`, props.params)}
        state={{ from: props.from }}
        className={props.className}
    >
        {props.children}
    </Link>
);

export default PageLink;