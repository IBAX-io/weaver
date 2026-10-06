/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect } from 'react';
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { useAppDispatch, useAppSelector } from 'lib/hooks';
import { fetchBalance, ISendTransferCall, sendTransfer } from 'modules/wallet/actions';
import { fromBaseUnits } from 'lib/tx/amount';
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
        word-break: break-all;
    }
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

    const address = account && account.wallet.address;
    const ecosystem = account && account.access.ecosystem;

    useEffect(() => {
        if (address && ecosystem) {
            dispatch(fetchBalance.started({ account: address, ecosystem }));
        }
    }, [dispatch, address, ecosystem]);

    if (!account) {
        return null;
    }

    // Never show the balance of an account or ecosystem the user has switched away from
    const balance = wallet.balance && wallet.balance.account === address && wallet.balance.ecosystem === ecosystem
        ? wallet.balance.value
        : null;
    const onSubmit = (call: ISendTransferCall) => dispatch(sendTransfer.started(call));
    const formsDisabled = isDemo || wallet.transferPending;

    return (
        <StyledWallet>
            <div className="wallet__content">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-4">
                    <div>
                        <h1 className="h3 mb-1">
                            <FormattedMessage id="wallet" defaultMessage="Wallet" />
                        </h1>
                        <div className="wallet__account font-monospace">{address}</div>
                        <div className="text-muted small">
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
                        onClick={() => dispatch(fetchBalance.started({ account: address, ecosystem }))}
                    >
                        {wallet.balancePending && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        <FormattedMessage id="wallet.balance.refresh" defaultMessage="Refresh" />
                    </Button>
                </div>

                {wallet.balanceError && (
                    <Alert variant="danger">
                        <FormattedMessage
                            id="wallet.balance.error"
                            defaultMessage="Could not load the balance ({error})"
                            values={{ error: wallet.balanceError }}
                        />
                    </Alert>
                )}

                {balance && (
                    <>
                        <Row xs={1} md={3} className="g-3 mb-4" aria-live="polite">
                            {BALANCES.map(item => (
                                <Col key={item.key}>
                                    <Card className="h-100">
                                        <Card.Body>
                                            <div className="text-muted small">
                                                <FormattedMessage id={item.id} defaultMessage={item.defaultMessage} />
                                            </div>
                                            <div className="wallet__amount">
                                                {fromBaseUnits(balance[item.key], balance.digits)} <small>{balance.token_symbol}</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {isDemo && (
                            <Alert variant="info">
                                <FormattedMessage
                                    id="wallet.demo"
                                    defaultMessage="The demo account's key is public, so it can only view balances. Sign in with your own account to send tokens."
                                />
                            </Alert>
                        )}

                        <Row xs={1} lg={2} className="g-3" key={wallet.transfersDone}>
                            <Col>
                                <UtxoTransferForm balance={balance} disabled={formsDisabled} onSubmit={onSubmit} />
                            </Col>
                            <Col>
                                <TransferSelfForm balance={balance} disabled={formsDisabled} onSubmit={onSubmit} />
                            </Col>
                        </Row>
                    </>
                )}

                {!balance && !wallet.balanceError && (
                    <div className="text-muted" role="status">
                        <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
                        <FormattedMessage id="wallet.balance.loading" defaultMessage="Loading balance…" />
                    </div>
                )}
            </div>
        </StyledWallet>
    );
};

export default Wallet;
