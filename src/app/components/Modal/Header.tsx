/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import themed from 'components/Theme/themed';

interface Props {
    onClose: () => void;
}

const StyledHeader = themed.div`
    background: ${props => props.theme.modalHeaderBackground};
    color: ${props => props.theme.modalHeaderForeground};
    margin: -1px -1px 0 -1px;
    height: 40px;
    line-height: 40px;
    padding: 0 15px;

    .header__close {
        border: 0;
        outline: 0;
        background: 0;
        padding: 0;
        position: absolute;
        top: 0;
        right: 0;
        width: 40px;
        height: 40px;
        color: ${props => props.theme.modalHeaderForeground};
        opacity: 0.5;
        font-size: 26px;

        &:hover {
            opacity: 1;
        }
    }
`;

const Header: React.SFC<Props> = props => (
    <StyledHeader>
        <div className="header__title">
            {props.children}
        </div>
        <button type="button" className="header__close" onClick={props.onClose}>&times;</button>
    </StyledHeader>
);

export default Header;