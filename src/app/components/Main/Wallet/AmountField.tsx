/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Form } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { fromBaseUnits } from 'lib/tx/amount';
import { TAmountCheck } from './validation';

interface Props {
    id: string;
    value: string;
    check: TAmountCheck;
    // Show problems only once the user has typed or tried to submit
    touched: boolean;
    digits: number;
    available: string;
    symbol: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}

const AmountField: React.FC<Props> = props => {
    const problem = props.touched && 'problem' in props.check ? props.check.problem : null;
    return (
        <Form.Group className="mb-3" controlId={props.id}>
            <Form.Label>
                <FormattedMessage id="wallet.amount" defaultMessage="Amount" />
            </Form.Label>
            <Form.Control
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={props.value}
                disabled={props.disabled}
                isInvalid={!!problem}
                aria-describedby={`${props.id}-available`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value)}
            />
            <Form.Control.Feedback type="invalid">
                {problem && (
                    <FormattedMessage
                        id={`wallet.error.${problem}`}
                        defaultMessage={problem}
                        values={{ digits: props.digits }}
                    />
                )}
            </Form.Control.Feedback>
            <Form.Text id={`${props.id}-available`} muted>
                <FormattedMessage
                    id="wallet.amount.available"
                    defaultMessage="Available: {amount} {symbol}"
                    values={{ amount: fromBaseUnits(props.available, props.digits), symbol: props.symbol }}
                />
            </Form.Text>
        </Form.Group>
    );
};

export default AmountField;
