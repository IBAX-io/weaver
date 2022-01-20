/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { ISection } from 'ibax/content';

import Section from './Section';
import Menu from 'containers/Main/Navigator/Menu';

interface Props {
    section: string;
    page: string;
    folded: boolean;
    menuActive: boolean;
    values: {
        [key: string]: ISection;
    };
}

const Sections: React.SFC<Props> = (props) => (
    <div className="fullscreen" style={{ position: 'relative' }}>
        <Menu section={props.section} />
        <Section
            name={props.section}
            folded={props.folded}
            menuActive={props.menuActive}
            page={props.values[props.section].page}
            breadcrumbs={props.values[props.section].breadcrumbs}
        />
    </div>
);

export default Sections;