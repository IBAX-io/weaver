/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import * as propTypes from 'prop-types';

import ValidatedForm from './ValidatedForm';

interface IValidatedSubmitProps extends ButtonProps {
    className?: string;
    disabled?: boolean;
}

const ValidatedSubmit: React.SFC<IValidatedSubmitProps> = (props, context: { form: ValidatedForm }) => (
    <Button
        type="submit"
        onClick={props.onClick && props.onClick}
        className={props.className}
        bsClass={props.bsClass}
        active={props.active}
        block={props.block}
        bsStyle={props.bsStyle}
        bsSize={props.bsSize}
        componentClass={props.componentClass}
        disabled={(context.form ? context.form.isPending() : false) || props.disabled}
    >
        {props.children}
    </Button>
);

ValidatedSubmit.contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};

export default ValidatedSubmit;