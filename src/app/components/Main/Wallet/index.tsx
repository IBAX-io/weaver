/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect } from 'react';
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { useAppDispatch, useAppSelector } from 'lib/hooks';
import { BALANCE_ERRORS, fetchBalance, ISendTransferCall, sendTransfer } from 'modules/wallet/actions';
import { formatAddress } from 'lib/crypto/address';
import { formatAmount } from 'lib/tx/amount';
import themed from 'components/Theme/themed';
import UtxoTransferForm from './UtxoTransferForm';
import TransferSelfForm from './TransferSelfForm';

const StyledWallet = themed.section`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: ${props => props.theme.contentBackground};
    color: ${props => props.theme.contentForeground};

    .wallet__content {
        max-width: 960px;
        margin: 0 auto;
        padding: 24px 16px;
    }

    .wallet__account {
        word-break: break-all;
    }

    .wallet__amount {
        font-size: 1.5rem;
        font-weight: 600;
        word-break: break-word;
    }

    /* Secondary text that still has to be read: the theme's body color, not the faint muted grey */
    .wallet__hint,
    .wallet__unit {
        color: ${props => props.theme.contentForeground};
    }

    /* Light alerts with dark text (the app's solid alerts are too faint to read) */
    .alert-info, .alert-warning, .alert-danger, .alert-success {
        --bs-alert-border-color: transparent;
    }
    .alert-info { --bs-alert-bg: var(--bs-info-bg-subtle); --bs-alert-color: var(--bs-info-text-emphasis); }
    .alert-warning { --bs-alert-bg: var(--bs-warning-bg-subtle); --bs-alert-color: var(--bs-warning-text-emphasis); }
    .alert-danger { --bs-alert-bg: var(--bs-danger-bg-subtle); --bs-alert-color: var(--bs-danger-text-emphasis); }
    .alert-success { --bs-alert-bg: var(--bs-success-bg-subtle); --bs-alert-color: var(--bs-success-text-emphasis); }
`;

const BALANCES = [
    { key: 'amount', id: 'wallet.balance.account', defaultMessage: 'Account balance' },
    { key: 'utxo', id: 'wallet.balance.utxo', defaultMessage: 'UTXO balance' },
    { key: 'total', id: 'wallet.balance.total', defaultMessage: 'Total' }
] as const;

const Wallet: React.FC = () => {
    const dispatch = useAppDispatch();
    const account = useAppSelector(state => state.auth.wallet);
    const isDemo = useAppSelector(state => state.auth.isDefaultWallet);
    const wallet = useAppSelector(state => state.wallet);

    const address = account && account.wallet && account.wallet.address;
    const ecosystem = account && account.access && account.access.ecosystem;

    useEffect(() => {
        if (address && ecosystem) {
            dispatch(fetchBalance.started({ account: address, ecosystem }));
        }
    }, [dispatch, address, ecosystem]);

    if (!address || !ecosystem) {
        return (
            <StyledWallet>
                <div className="wallet__content">
                    <p><FormattedMessage id="wallet.signedOut" defaultMessage="Sign in to see your wallet." /></p>
                </div>
            </StyledWallet>
        );
    }

    // Never show the balance of an account or ecosystem the user has switched away from
    const balance = wallet.balance && wallet.balance.account === address && wallet.balance.ecosystem === ecosystem
        ? wallet.balance
        : null;
    const onSubmit = (call: ISendTransferCall) => dispatch(sendTransfer.started(call));
    const formsDisabled = isDemo || null !== wallet.transferPending;
    const errorCode = wallet.balanceError && BALANCE_ERRORS.includes(wallet.balanceError) ? wallet.balanceError : 'E_SERVER';
    const last = wallet.lastTransfer;

    return (
        <StyledWallet>
            <div className="wallet__content">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <FormattedMessage id="wallet" defaultMessage="Wallet" />
                        </h1>
                        <div className="wallet__account font-monospace">{address}</div>
                        <div className="wallet__hint small">
                            {account.access.name || (
                                <FormattedMessage
                                    id="general.wallet.ecosystemNo"
                                    defaultMessage="Ecosystem #{ecosystem}"
                                    values={{ ecosystem }}
                                />
                            )}
                        </div>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        disabled={wallet.balancePending}
                        aria-busy={wallet.balancePending}
                        onClick={() => dispatch(fetchBalance.started({ account: address, ecosystem }))}
                    >
                        {wallet.balancePending && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        <FormattedMessage id="wallet.balance.refresh" defaultMessage="Refresh" />
                    </Button>
                </div>

                {/* Announced to screen readers: loading, failures, finished transfers */}
                <div role="status" aria-live="polite">
                    {!balance && !wallet.balanceError && (
                        <p>
                            <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
                            <FormattedMessage id="wallet.balance.loading" defaultMessage="Loading balance…" />
                        </p>
                    )}
                    {wallet.balanceError && (
                        <Alert variant={balance ? 'warning' : 'danger'}>
                            <FormattedMessage id={`wallet.balance.error.${errorCode}`} defaultMessage="Could not load the balance." />
                            {balance && (
                                <>
                                    {' '}
                                    <FormattedMessage id="wallet.balance.stale" defaultMessage="Showing the last known balance." />
                                </>
                            )}
                        </Alert>
                    )}
                    {last && balance && (
                        <Alert variant="success">
                            {'utxo' === last.call.transfer.type ? (
                                <FormattedMessage
                                    id="wallet.done.utxo"
                                    defaultMessage="Sent {amount} {symbol} to {address}."
                                    values={{
                                        amount: formatAmount(last.call.transfer.amount, balance.value.digits),
                                        symbol: balance.value.token_symbol,
                                        address: formatAddress(last.call.transfer.toID)
                                    }}
                                />
                            ) : (
                                <FormattedMessage
                                    id={`wallet.done.${last.call.transfer.direction}`}
                                    defaultMessage="Moved {amount} {symbol}."
                                    values={{
                                        amount: formatAmount(last.call.transfer.amount, balance.value.digits),
                                        symbol: balance.value.token_symbol
                                    }}
                                />
                            )}
                            {last.result.hash && (
                                <div className="small font-monospace text-break">
                                    <FormattedMessage id="wallet.done.hash" defaultMessage="Transaction {hash}" values={{ hash: last.result.hash }} />
                                </div>
                            )}
                        </Alert>
                    )}
                </div>

                {isDemo && (
                    <Alert variant="info">
                        <FormattedMessage
                            id="wallet.demo"
                            defaultMessage="The demo account's key is public, so it can only view balances. Sign in with your own account to send tokens."
                        />
                    </Alert>
                )}

                {balance && (
                    <>
                        <Row xs={1} md={3} className="g-3 mb-4">
                            {BALANCES.map(item => (
                                <Col key={item.key}>
                                    <Card className="h-100">
                                        <Card.Body>
                                            <div className="wallet__hint small">
                                                <FormattedMessage id={item.id} defaultMessage={item.defaultMessage} />
                                            </div>
                                            <div className="wallet__amount">
                                                {formatAmount(balance.value[item.key], balance.value.digits)} <small>{balance.value.token_symbol}</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Row xs={1} lg={2} className="g-3">
                            <Col>
                                <UtxoTransferForm
                                    key={wallet.transfersDone.utxo}
                                    balance={balance}
                                    ecosystem={ecosystem}
                                    disabled={formsDisabled}
                                    pending={'utxo' === wallet.transferPending}
                                    onSubmit={onSubmit}
                                />
                            </Col>
                            <Col>
                                <TransferSelfForm
                                    key={wallet.transfersDone.transferSelf}
                                    balance={balance.value}
                                    disabled={formsDisabled}
                                    pending={'transferSelf' === wallet.transferPending}
                                    onSubmit={onSubmit}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        </StyledWallet>
    );
};

export default Wallet;
