/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';

const StyledHeading = themed.div`
    z-index: 1000;
    font-size: 20px;
    line-height: 45px;
    height: 46px;
    color: #000;
    font-weight: normal;
    margin-top: 10px;
    padding: 0 20px;
    border: 0;
`;

export interface IHeadingProps {
    className?: string;
}

const Heading: React.SFC<IHeadingProps> = props => (
    <StyledHeading className={props.className}>
        <div>
            {props.children}
        </div>
    </StyledHeading >
);

export default Heading;