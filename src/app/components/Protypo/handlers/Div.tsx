/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styledComponent from './StyledComponent';
import interactiveComponent from '../interaction/InteractiveComponent';

export interface IDivProps {
  id: string;
  className?: string;
  class?: string;
}

const Div: React.SFC<IDivProps> = (props) => (
  <div className={[props.class, props.className].join(' ')}>
    {props.children}
  </div>
);

export default interactiveComponent(styledComponent(Div));
