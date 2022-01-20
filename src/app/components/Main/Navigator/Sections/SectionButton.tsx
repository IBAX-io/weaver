/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { generateRoute } from 'services/router';

import HeaderLink from 'components/Main/Header/HeaderLink';

interface Props {
    section: string;
    page: string;
    params: { [name: string]: string };
    active?: boolean;
}

const SectionButton: React.SFC<Props> = props => (
    <HeaderLink to={generateRoute(`/browse/${props.section}/${props.page}`, props.params)} active={props.active}>
        {props.children}
    </HeaderLink>
);

export default SectionButton;