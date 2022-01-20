/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormGroup, FormGroupProps } from 'react-bootstrap';
import * as propTypes from 'prop-types';

import ValidatedForm from './ValidatedForm';

interface IValidatedFormGroupProps extends FormGroupProps {
    for: string;
}

export default class ValidatedFormGroup extends React.Component<IValidatedFormGroupProps> {
    render() {
        const valid = this.context.form ? (this.context.form as ValidatedForm).getState(this.props.for) : true;
        return (
            <FormGroup
                className={this.props.className}
                validationState={valid ? null : 'error'}
                bsClass={this.props.bsClass}
                bsSize={this.props.bsSize}
                controlId={this.props.controlId}
            >
                {this.props.children}
            </FormGroup >
        );
    }
}

(ValidatedFormGroup as React.ComponentClass).contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};