/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { IBreadcrumb } from 'ibax/content';
import { FormattedMessage } from 'react-intl';

import themed from 'components/Theme/themed';
import Toolbar from 'components/Main/Toolbar';
import Breadcrumb from './Breadcrumb';
import ToolButton from 'components/Main/Toolbar/ToolButton';

interface Props {
    values: IBreadcrumb[];
    onRefresh: () => void;
}

const StyledBreadcrumbs = themed.ul`
    height: 100%;
    line-height: inherit;
    margin: 0;
    padding: 0 10px;
    font-size: 0;
    flex: 1;
    
    > li {
        display: inline-block;
        font-size: 13px;
        font-weight: 400;
        height: 100%;
        line-height: inherit;
        color: ${props => props.theme.toolbarForegroundActive};
        margin-right: 10px;
        vertical-align: top;

        &:first-child:before {
            content: none;
        }

        &:before {
            content: '/';
            font-size: 13px;
            color: ${props => props.theme.toolbarSpacerForeground};
            display: inline-block;
            margin-right: 8px;
        }
    }
`;

const Breadcrumbs: React.SFC<Props> = (props) => (
    <Toolbar>
        <StyledBreadcrumbs>
            {props.values.map((breadcrumb, i) => (
                <li key={i}>
                    <Breadcrumb
                        home={i === 0}
                        active={i !== props.values.length - 1}
                        section={breadcrumb.section}
                        page={breadcrumb.page}
                        params={breadcrumb.params}
                    >
                        {breadcrumb.title}
                    </Breadcrumb>
                </li>
            ))}
            {1 === props.values.length && (
                <li>
                    <Breadcrumb
                        section=""
                        page=""
                        params={{}}
                    >
                        <FormattedMessage id="navigation.default_page" defaultMessage="Home page" />
                    </Breadcrumb>
                </li>
            )}
        </StyledBreadcrumbs>
        <ToolButton icon="icon-refresh" onClick={props.onRefresh}>
            <FormattedMessage id="navigation.refresh" defaultMessage="Refresh" />
        </ToolButton>
    </Toolbar>
);

export default Breadcrumbs;