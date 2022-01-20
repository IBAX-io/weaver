/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import { IPage, IBreadcrumb } from 'ibax/content';

import Page from '../Page';
import themed from 'components/Theme/themed';
import ResizeHandle from 'containers/Main/Navigator/Menu/ResizeHandle';

interface Props {
    name: string;
    page?: IPage;
    breadcrumbs: IBreadcrumb[];
    folded: boolean;
    menuActive: boolean;
}

const StyledSection = themed.div`
    background: ${(props) => props.theme.contentBackground};
   /*   box-shadow: rgba(0,0,0,0.06) -5px 0 10px;  */
    position: relative;
    z-index: 100;
    margin-left: ${(props) => props.theme.menuSize}px;
    transition: margin-left ease-in-out .12s, transform ease-in-out .12s;
    
    &.section_folded {
        margin-left: ${(props) => props.theme.menuSizeFolded}px;

        &.section_unfolded {
            margin-left: 0;
            transform: translateX(${(props) => props.theme.menuSize}px);
        }
    }
`;

const Section: React.SFC<Props> = props => (
    <StyledSection className={classNames('fullscreen', { section_folded: props.folded, section_unfolded: props.menuActive })}>
        <ResizeHandle />
        {props.page && (
            <Page value={props.page} section={props.name} />
        )}
    </StyledSection>
);

export default Section;