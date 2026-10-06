/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';

import { IParamsSpec } from '../Protypo';
import { ProtypoContext } from '../ProtypoContext';
import StyledComponent from './StyledComponent';
import PageLink from 'containers/Routing/PageLink';

export interface ILinkPageProps {
    'class'?: string;
    'className'?: string;
    'page'?: string;
    'pageparams'?: IParamsSpec;
}

const LinkPage: React.FC<React.PropsWithChildren<ILinkPageProps>> = props => {
    const context = useContext(ProtypoContext);

    return (
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
};

export default StyledComponent(LinkPage);