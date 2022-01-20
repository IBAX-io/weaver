/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

import ValidationMessage from 'components/Validation/ValidationMessage';

export interface IInputErrProps {
    'name'?: string;
    [key: string]: string;
}

const InputErr: React.SFC<IInputErrProps> = (props) => (
    <ValidationMessage for={props.name} messages={props} />
);

export default InputErr;