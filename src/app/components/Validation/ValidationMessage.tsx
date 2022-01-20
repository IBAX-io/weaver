/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as propTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import ValidatedForm from './ValidatedForm';

interface IValidationMessageProps {
    className?: string;
    for: string;
    messages?: {
        [validator: string]: string;
    };
}

interface IValidationMessageContext {
    form: ValidatedForm;
}

const ValidationMessage: React.SFC<IValidationMessageProps> = (props, context: IValidationMessageContext) => {
    let result = null;

    if (context.form) {
        const value = !context.form.getState(props.for) && context.form.validate(props.for);
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

ValidationMessage.contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};

export default ValidationMessage;