/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { IBalanceResponse } from 'ibax/api';
import { formatAddress } from 'lib/crypto/address';
import { fromBaseUnits } from 'lib/tx/amount';
import { ISendTransferCall } from 'modules/wallet/actions';
import { checkAmount, checkRecipient } from './validation';
import AmountField from './AmountField';

interface Props {
    balance: IBalanceResponse;
    disabled: boolean;
    onSubmit: (call: ISendTransferCall) => void;
}

// Sends from the UTXO balance to another account (go-ibax transaction type 5)
const UtxoTransferForm: React.FC<Props> = props => {
    const intl = useIntl();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [comment, setComment] = useState('');
    const [touched, setTouched] = useState({ recipient: false, amount: false });

    const recipientCheck = checkRecipient(recipient);
    const amountCheck = checkAmount(amount, props.balance.digits, props.balance.utxo);
    const recipientProblem = touched.recipient && 'problem' in recipientCheck ? recipientCheck.problem : null;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ recipient: true, amount: true });
        if (!('toID' in recipientCheck) || !('units' in amountCheck)) {
            return;
        }
        const values = {
            amount: fromBaseUnits(amountCheck.units, props.balance.digits),
            symbol: props.balance.token_symbol,
            address: formatAddress(recipientCheck.toID)
        };
        props.onSubmit({
            transfer: { type: 'utxo', recipient: recipientCheck.toID, amount: amountCheck.units, comment: comment.trim() },
            confirm: {
                title: intl.formatMessage({ id: 'wallet.confirm.utxo.title', defaultMessage: 'Send {amount} {symbol}?' }, values),
                description: intl.formatMessage({
                    id: 'wallet.confirm.utxo.desc',
                    defaultMessage: '{amount} {symbol} will be sent to {address}. Network fees are paid from your UTXO balance. A transfer cannot be reversed.'
                }, values),
                confirmButton: intl.formatMessage({ id: 'wallet.utxo.submit', defaultMessage: 'Send' })
            }
        });
    };

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Title as="h2" className="h5">
                    <FormattedMessage id="wallet.utxo.title" defaultMessage="Send" />
                </Card.Title>
                <Card.Text className="text-muted small">
                    <FormattedMessage id="wallet.utxo.desc" defaultMessage="Sends tokens from your UTXO balance to another account." />
                </Card.Text>
                <Form noValidate onSubmit={onSubmit}>
                    <Form.Group className="mb-3" controlId="wallet-utxo-recipient">
                        <Form.Label>
                            <FormattedMessage id="wallet.utxo.recipient" defaultMessage="Recipient address" />
                        </Form.Label>
                        <Form.Control
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            className="font-monospace"
                            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                            value={recipient}
                            disabled={props.disabled}
                            isInvalid={!!recipientProblem}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value)}
                            onBlur={() => setTouched(state => ({ ...state, recipient: true }))}
                        />
                        <Form.Control.Feedback type="invalid">
                            {recipientProblem && (
                                <FormattedMessage id={`wallet.error.recipient.${recipientProblem}`} defaultMessage={recipientProblem} />
                            )}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <AmountField
                        id="wallet-utxo-amount"
                        value={amount}
                        check={amountCheck}
                        touched={touched.amount}
                        digits={props.balance.digits}
                        available={props.balance.utxo}
                        symbol={props.balance.token_symbol}
                        disabled={props.disabled}
                        onChange={value => {
                            setAmount(value);
                            setTouched(state => ({ ...state, amount: true }));
                        }}
                    />
                    <Form.Group className="mb-3" controlId="wallet-utxo-comment">
                        <Form.Label>
                            <FormattedMessage id="wallet.utxo.comment" defaultMessage="Comment (optional)" />
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={comment}
                            disabled={props.disabled}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setComment(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Text as="p" className="small" muted>
                        <FormattedMessage id="wallet.utxo.fee" defaultMessage="Network fees are paid from your UTXO balance in ecosystem 1, in addition to the amount." />
                    </Form.Text>
                    <Button type="submit" variant="primary" disabled={props.disabled}>
                        <FormattedMessage id="wallet.utxo.submit" defaultMessage="Send" />
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default UtxoTransferForm;
