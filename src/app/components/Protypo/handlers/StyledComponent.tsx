/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import { sanitizeTemplateStyle } from 'lib/css/chainCss';

type TComponentConstructor<T> = React.ComponentClass<T & IStyledComponentProps> | React.FC<T & IStyledComponentProps>;

interface IStyledComponentProps {
    style?: string;
}

// The template's .Style(...) for this element, once it is known to stay inside it
export default function styledComponent<T>(Component: TComponentConstructor<T & IStyledComponentProps>) {
    return styled(Component)`${props => sanitizeTemplateStyle(props.style)}`;
}