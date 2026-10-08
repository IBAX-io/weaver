/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { ValidatedFormContext } from './ValidatedForm';

interface IValidationMessageProps {
    className?: string;
    for: string;
    messages?: {
        [validator: string]: string;
    };
}

const ValidationMessage: React.FC<IValidationMessageProps> = props => {
    const { form } = React.useContext(ValidatedFormContext);
    let result = null;

    if (form) {
        const value = !form.getState(props.for) && form.validate(props.for);
        if (value && value.error) {
            const message = props.messages && props.messages[value.validator.name];
            if (!message) {
                result = (
                    <FormattedMessage id={`validation.${value.validator.name}`} defaultMessage="This field contains invalid data" />
                );
            }
            else if ('string' === typeof message) {
                result = message;
            }
            else {
                result = (
                    <FormattedMessage id="validation.field.invalid" defaultMessage="This field contains invalid data" />
                );
            }
        }
    }

    return (
        <span className={props.className === undefined ? 'text-danger' : props.className}>
            {result && (
                <span>
                    <span>* </span>
                    {result}
                </span>
            )}
        </span>
    );
};

export default ValidationMessage;