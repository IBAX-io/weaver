/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import classnames from 'classnames';
import { Form, FormGroupProps } from 'react-bootstrap';

import { ValidatedFormContext } from './ValidatedForm';

interface IValidatedFormGroupProps extends FormGroupProps {
    for: string;
}

export interface IValidatedFormGroupContext {
    invalid: boolean;
}

// Lets the validated controls inside a group render the Bootstrap 5 invalid state
// (the Bootstrap 3 group-level `has-error` styling no longer exists).
export const ValidatedFormGroupContext = React.createContext<IValidatedFormGroupContext>({ invalid: false });

const ValidatedFormGroup: React.FC<React.PropsWithChildren<IValidatedFormGroupProps>> = props => {
    const { form } = React.useContext(ValidatedFormContext);
    const valid = form ? form.getState(props.for) : true;

    return (
        <Form.Group
            className={classnames('mb-3', props.className)}
            controlId={props.controlId}
        >
            <ValidatedFormGroupContext.Provider value={{ invalid: !valid }}>
                {props.children}
            </ValidatedFormGroupContext.Provider>
        </Form.Group>
    );
};

export default ValidatedFormGroup;
