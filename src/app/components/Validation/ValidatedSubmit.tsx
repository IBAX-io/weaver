/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';

import { ValidatedFormContext } from './ValidatedForm';

interface IValidatedSubmitProps extends ButtonProps {
    className?: string;
    disabled?: boolean;
}

// Without an explicit variant the button keeps the old Bootstrap 3 "default" look
const ValidatedSubmit: React.FC<React.PropsWithChildren<IValidatedSubmitProps>> = props => {
    const { form } = React.useContext(ValidatedFormContext);

    return (
        <Button
            type="submit"
            onClick={props.onClick}
            className={props.className}
            active={props.active}
            variant={props.variant ?? 'secondary'}
            size={props.size}
            as={props.as}
            disabled={(form ? form.isPending() : false) || props.disabled}
        >
            {props.children}
        </Button>
    );
};

export default ValidatedSubmit;
