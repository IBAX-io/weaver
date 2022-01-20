/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

export interface IForListProps {

}

const ForList: React.SFC<IForListProps> = (props) => (
    <div>{props.children}</div>
);

export default ForList;