/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';

export interface ICodeProps {
    className?: string;
    text: string;
}

const Code: React.SFC<ICodeProps> = props => (
    <span className={props.className}>
        {props.text}
    </span>
);

export default styled(Code) `
    white-space: pre-wrap;
`;