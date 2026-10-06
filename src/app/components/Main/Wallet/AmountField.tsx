/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Form } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { formatAmount } from 'lib/tx/amount';
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
    // What "available" means here, e.g. "UTXO balance"
    availableLabel: React.ReactNode;
    disabled?: boolean;
    onChange: (value: string) => void;
}

const AmountField: React.FC<Props> = props => {
    const problem = props.touched && 'problem' in props.check ? props.check.problem : null;
    const hintID = `${props.id}-available`;
    const errorID = `${props.id}-error`;
    return (
        <Form.Group className="mb-3" controlId={props.id}>
            <Form.Label>
                <FormattedMessage id="wallet.amount" defaultMessage="Amount" /> <span className="wallet__unit">({props.symbol})</span>
            </Form.Label>
            <Form.Control
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={props.value}
                disabled={props.disabled}
                isInvalid={!!problem}
                aria-invalid={!!problem}
                aria-describedby={problem ? `${errorID} ${hintID}` : hintID}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value)}
            />
            <Form.Control.Feedback type="invalid" id={errorID}>
                {problem && (
                    <FormattedMessage
                        id={`wallet.error.${problem}`}
                        defaultMessage={problem}
                        values={{ digits: props.digits }}
                    />
                )}
            </Form.Control.Feedback>
            <Form.Text id={hintID} className="wallet__hint">
                {props.availableLabel}: {formatAmount(props.available, props.digits)} {props.symbol}
            </Form.Text>
        </Form.Group>
    );
};

export default AmountField;
