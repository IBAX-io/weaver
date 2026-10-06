/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { formatAddress } from 'lib/crypto/address';
import { formatAmount } from 'lib/tx/amount';
import { FEE_ECOSYSTEM, ISendTransferCall, IWalletBalance } from 'modules/wallet/actions';
import { checkAmount, checkRecipient } from './validation';
import AmountField from './AmountField';

interface Props {
    balance: IWalletBalance;
    ecosystem: string;
    disabled: boolean;
    pending: boolean;
    onSubmit: (call: ISendTransferCall) => void;
}

// Sends from the UTXO balance to another account (go-ibax transaction type 5). The node charges the
// network fee from the UTXO balance of ecosystem 1, and in other ecosystems possibly from theirs
// too (smart.UtxoToken), before it checks the amount: the balance can never be sent in full.
const UtxoTransferForm: React.FC<Props> = props => {
    const intl = useIntl();
    const { value, fee } = props.balance;
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [touched, setTouched] = useState({ recipient: false, amount: false });

    const inFeeEcosystem = FEE_ECOSYSTEM === props.ecosystem;
    const noFeeUtxo = !inFeeEcosystem && 0n === BigInt(fee.utxo);
    const recipientCheck = checkRecipient(recipient);
    const amountCheck = checkAmount(amount, value.digits, value.utxo, true);
    const recipientProblem = touched.recipient && 'problem' in recipientCheck ? recipientCheck.problem : null;
    const disabled = props.disabled || noFeeUtxo;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ recipient: true, amount: true });
        if (disabled || !('toID' in recipientCheck) || !('units' in amountCheck)) {
            return;
        }
        const values = {
            amount: formatAmount(amountCheck.units, value.digits),
            symbol: value.token_symbol,
            address: formatAddress(recipientCheck.toID)
        };
        props.onSubmit({
            transfer: { type: 'utxo', toID: recipientCheck.toID, amount: amountCheck.units },
            confirm: {
                title: intl.formatMessage({ id: 'wallet.confirm.utxo.title', defaultMessage: 'Send {amount} {symbol}?' }, values),
                description: inFeeEcosystem
                    ? intl.formatMessage({
                        id: 'wallet.confirm.utxo.desc',
                        defaultMessage: '{amount} {symbol} will be sent to {address}. The network fee is paid from your UTXO balance on top of it. A transfer cannot be reversed.'
                    }, values)
                    : intl.formatMessage({
                        id: 'wallet.confirm.utxo.desc.other',
                        defaultMessage: '{amount} {symbol} will be sent to {address}. The network fee is paid from your UTXO balance in ecosystem 1, and may also be charged in this ecosystem\'s UTXO balance. A transfer cannot be reversed.'
                    }, values),
                confirmButton: intl.formatMessage({ id: 'wallet.utxo.submit', defaultMessage: 'Send' })
            },
            unknownRecipientWarning: intl.formatMessage({
                id: 'wallet.confirm.utxo.unknownRecipient',
                defaultMessage: 'This address has no account on this network yet. Check it digit by digit: coins sent to a mistyped address cannot be recovered.'
            })
        });
    };

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Title as="h2" className="h5">
                    <FormattedMessage id="wallet.utxo.title" defaultMessage="Send" />
                </Card.Title>
                <Card.Text className="wallet__hint small">
                    <FormattedMessage id="wallet.utxo.desc" defaultMessage="Sends tokens from your UTXO balance to another account." />
                </Card.Text>
                {noFeeUtxo && (
                    <Alert variant="warning" className="wallet__alert small">
                        <FormattedMessage
                            id="wallet.utxo.noFeeUtxo"
                            defaultMessage="The network fee is paid from your UTXO balance in ecosystem 1, which is empty. Move some {symbol} to UTXO in ecosystem 1 first."
                            values={{ symbol: fee.token_symbol }}
                        />
                    </Alert>
                )}
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
                            value={recipient}
                            disabled={disabled}
                            isInvalid={!!recipientProblem}
                            aria-invalid={!!recipientProblem}
                            aria-describedby={recipientProblem ? 'wallet-utxo-recipient-error wallet-utxo-recipient-hint' : 'wallet-utxo-recipient-hint'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value)}
                            onBlur={() => setTouched(state => ({ ...state, recipient: true }))}
                        />
                        <Form.Control.Feedback type="invalid" id="wallet-utxo-recipient-error">
                            {recipientProblem && (
                                <FormattedMessage id={`wallet.error.recipient.${recipientProblem}`} defaultMessage={recipientProblem} />
                            )}
                        </Form.Control.Feedback>
                        <Form.Text id="wallet-utxo-recipient-hint" className="wallet__hint">
                            <FormattedMessage id="wallet.utxo.recipient.hint" defaultMessage="XXXX-XXXX-XXXX-XXXX-XXXX; the last digit is a checksum." />
                        </Form.Text>
                    </Form.Group>
                    <AmountField
                        id="wallet-utxo-amount"
                        value={amount}
                        check={amountCheck}
                        touched={touched.amount}
                        digits={value.digits}
                        available={value.utxo}
                        symbol={value.token_symbol}
                        availableLabel={<FormattedMessage id="wallet.balance.utxo" defaultMessage="UTXO balance" />}
                        disabled={disabled}
                        onChange={next => {
                            setAmount(next);
                            setTouched(state => ({ ...state, amount: true }));
                        }}
                    />
                    <p className="wallet__hint small">
                        {inFeeEcosystem ? (
                            <FormattedMessage
                                id="wallet.utxo.fee"
                                defaultMessage="The network fee is paid from this UTXO balance on top of the amount, so keep some of it."
                            />
                        ) : (
                            <FormattedMessage
                                id="wallet.utxo.fee.other"
                                defaultMessage="The network fee is paid from your UTXO balance in ecosystem 1 ({amount} {symbol}), and may also be charged in this ecosystem's UTXO balance, on top of the amount."
                                values={{ amount: formatAmount(fee.utxo, fee.digits), symbol: fee.token_symbol }}
                            />
                        )}
                    </p>
                    <Button type="submit" variant="primary" disabled={disabled} aria-busy={props.pending}>
                        {props.pending && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        {props.pending
                            ? <FormattedMessage id="wallet.sending" defaultMessage="Sending…" />
                            : <FormattedMessage id="wallet.utxo.submit" defaultMessage="Send" />}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default UtxoTransferForm;
