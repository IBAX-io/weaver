/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import propTypes from 'prop-types';

import { IParamsSpec } from '../Protypo';
import StyledComponent from './StyledComponent';
import PageLink from 'containers/Routing/PageLink';

export interface ILinkPageProps {
    'class'?: string;
    'className'?: string;
    'page'?: string;
    'pageparams'?: IParamsSpec;
}

interface ILinkPageContext {
    section: string;
    getFromContext: () => any;
    protypo: any;
}

const LinkPage: React.SFC<ILinkPageProps> = (props, context: ILinkPageContext) => (
    <PageLink
        className={[props.class, props.className].join(' ')}
        section={context.section}
        page={props.page || ''}
        params={props.pageparams ? context.protypo.resolveParams(props.pageparams) : {}}
        from={context.protypo.getFromContext(props.children)}
    >
        {props.children}
    </PageLink>
);

LinkPage.contextTypes = {
    protypo: propTypes.object.isRequired,
    section: propTypes.string.isRequired
};

export default StyledComponent(LinkPage);