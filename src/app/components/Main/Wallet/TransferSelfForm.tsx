/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { IBalanceResponse } from 'ibax/api';
import { TTransferSelfDirection } from 'ibax/tx';
import { fromBaseUnits } from 'lib/tx/amount';
import { ISendTransferCall } from 'modules/wallet/actions';
import { checkAmount } from './validation';
import AmountField from './AmountField';

interface Props {
    balance: IBalanceResponse;
    disabled: boolean;
    onSubmit: (call: ISendTransferCall) => void;
}

// Moves the signer's own tokens between the account and UTXO balances (go-ibax transaction type 6)
const TransferSelfForm: React.FC<Props> = props => {
    const intl = useIntl();
    const [direction, setDirection] = useState<TTransferSelfDirection>('toUTXO');
    const [amount, setAmount] = useState('');
    const [touched, setTouched] = useState(false);

    const available = direction === 'toUTXO' ? props.balance.amount : props.balance.utxo;
    const amountCheck = checkAmount(amount, props.balance.digits, available);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!('units' in amountCheck)) {
            return;
        }
        const values = { amount: fromBaseUnits(amountCheck.units, props.balance.digits), symbol: props.balance.token_symbol };
        props.onSubmit({
            transfer: { type: 'transferSelf', amount: amountCheck.units, direction },
            confirm: {
                title: intl.formatMessage({ id: 'wallet.confirm.move.title', defaultMessage: 'Move {amount} {symbol}?' }, values),
                description: direction === 'toUTXO'
                    ? intl.formatMessage({ id: 'wallet.confirm.move.toUTXO', defaultMessage: '{amount} {symbol} will move from your account balance to your UTXO balance.' }, values)
                    : intl.formatMessage({ id: 'wallet.confirm.move.toAccount', defaultMessage: '{amount} {symbol} will move from your UTXO balance to your account balance.' }, values),
                confirmButton: intl.formatMessage({ id: 'wallet.move.submit', defaultMessage: 'Move' })
            }
        });
    };

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Title as="h2" className="h5">
                    <FormattedMessage id="wallet.move.title" defaultMessage="Move between balances" />
                </Card.Title>
                <Card.Text className="text-muted small">
                    <FormattedMessage id="wallet.move.desc" defaultMessage="Moves your tokens between your account balance and your UTXO balance." />
                </Card.Text>
                <Form noValidate onSubmit={onSubmit}>
                    <Form.Group className="mb-3" controlId="wallet-move-direction">
                        <Form.Label>
                            <FormattedMessage id="wallet.move.direction" defaultMessage="Direction" />
                        </Form.Label>
                        <Form.Select
                            value={direction}
                            disabled={props.disabled}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDirection(e.target.value === 'toAccount' ? 'toAccount' : 'toUTXO')}
                        >
                            <option value="toUTXO">{intl.formatMessage({ id: 'wallet.move.toUTXO', defaultMessage: 'Account → UTXO' })}</option>
                            <option value="toAccount">{intl.formatMessage({ id: 'wallet.move.toAccount', defaultMessage: 'UTXO → Account' })}</option>
                        </Form.Select>
                    </Form.Group>
                    <AmountField
                        id="wallet-move-amount"
                        value={amount}
                        check={amountCheck}
                        touched={touched}
                        digits={props.balance.digits}
                        available={available}
                        symbol={props.balance.token_symbol}
                        disabled={props.disabled}
                        onChange={value => {
                            setAmount(value);
                            setTouched(true);
                        }}
                    />
                    <Button type="submit" variant="primary" disabled={props.disabled}>
                        <FormattedMessage id="wallet.move.submit" defaultMessage="Move" />
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default TransferSelfForm;
