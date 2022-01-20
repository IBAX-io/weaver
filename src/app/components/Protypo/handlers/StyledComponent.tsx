/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';

type TComponentConstructor<T> = React.ComponentClass<T & IStyledComponentProps> | React.SFC<T & IStyledComponentProps>;

interface IStyledComponentProps {
    style?: string;
}

export default function styledComponent<T>(Component: TComponentConstructor<T & IStyledComponentProps>) {
    return styled(Component) `${props => props.style}`;
}