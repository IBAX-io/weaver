/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect } from 'react';
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useAppDispatch, useAppSelector } from 'lib/hooks';
import { fetchBalance, fetchHistory, fetchUtxoHistory, ISendTransferCall, sendTransfer, walletErrorCode } from 'modules/wallet/actions';
import { DEFAULT_HISTORY_FILTER, THistoryFilter } from 'modules/wallet/history';
import { IExplorerCursor } from 'modules/wallet/utxoHistory';
import { sameOwner } from 'modules/wallet/reducer';
import { formatAddress } from 'lib/crypto/address';
import { formatAmount } from 'lib/tx/amount';
import themed from 'components/Theme/themed';
import UtxoTransferForm from './UtxoTransferForm';
import TransferSelfForm from './TransferSelfForm';
import BalanceAmount from './BalanceAmount';
import History from './History';
import UtxoHistory from './UtxoHistory';

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

    /* A balance stays one number (BalanceAmount): the font shrinks to the card's width (container
       units) divided by the number's length in characters, a tabular digit being about 0.6em wide,
       with a little to spare; past the smallest size the number wraps at its decimal point only */
    .wallet__balance {
        container-type: inline-size;
    }

    .wallet__amount {
        font-size: clamp(0.875rem, calc(100cqi / (var(--wallet-amount-chars, 1) * 0.62)), 1.5rem);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
    }

    .wallet__amount-part {
        white-space: nowrap;
    }

    /* History: what happened on the left, the amount on the right (below it on a narrow card) */
    .wallet__history-entry {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 4px 16px;
        padding: 10px 0;
        border-top: 1px solid var(--bs-border-color);
    }

    .wallet__history-main {
        flex: 1 1 260px;
        min-width: 0;
    }

    /* Pushed right also when it wraps under the text */
    .wallet__history-amount {
        margin-left: auto;
        text-align: end;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    /* An icon button with room enough to hit (24px) */
    .wallet__history-copy {
        min-width: 24px;
        min-height: 24px;
        padding: 0 4px;
    }

    /* A failed transfer's amount, which never moved */
    .wallet__history-amount_void {
        font-weight: normal;
        text-decoration: line-through;
        color: ${props => props.theme.contentForeground};
    }

    .wallet__history-penalty {
        white-space: normal;
        text-align: start;
    }

    /* The theme's .btn has no border, which left the outline buttons as bare words */
    .wallet__history-filter .btn-outline-primary {
        border: 1px solid var(--bs-btn-border-color);
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
    const intl = useIntl();
    const account = useAppSelector(state => state.auth.wallet);
    const isDemo = useAppSelector(state => state.auth.isDefaultWallet);
    const wallet = useAppSelector(state => state.wallet);

    const address = account && account.wallet && account.wallet.address;
    const ecosystem = account && account.access && account.access.ecosystem;

    // Shown only while it is this account's and ecosystem's, like the balance
    const history = address && ecosystem && sameOwner(wallet.history, { account: address, ecosystem }) ? wallet.history : null;
    const historyFilter: THistoryFilter = history ? history.filter : DEFAULT_HISTORY_FILTER;
    // From the newest row, or the rows older than the oldest shown
    const loadHistory = (filter: THistoryFilter, before: string | null = null) =>
        dispatch(fetchHistory.started({ account: address, ecosystem, filter, before }));

    const utxoHistory = address && ecosystem && sameOwner(wallet.utxoHistory, { account: address, ecosystem }) ? wallet.utxoHistory : null;
    // From the newest transaction, or where the last page stopped
    const loadUtxoHistory = (cursor: IExplorerCursor | null) => dispatch(fetchUtxoHistory.started({ account: address, ecosystem, cursor }));
    // The block explorer the network names (its host is shown: the address is sent there)
    const explorer = useAppSelector(state => {
        const session = state.auth.session;
        const network = session && state.storage.networks.find(item => item.uuid === session.network.uuid);
        return network && network.explorer ? network.explorer : null;
    });
    const explorerHost = explorer ? new URL(explorer).host : null;

    useEffect(() => {
        if (address && ecosystem) {
            dispatch(fetchBalance.started({ account: address, ecosystem }));
            dispatch(fetchHistory.started({ account: address, ecosystem, filter: DEFAULT_HISTORY_FILTER, before: null }));
            dispatch(fetchUtxoHistory.started({ account: address, ecosystem, cursor: null }));
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
    const balance = sameOwner(wallet.balance, { account: address, ecosystem }) ? wallet.balance : null;
    const onSubmit = (call: ISendTransferCall) => dispatch(sendTransfer.started(call));
    const formsDisabled = isDemo || null !== wallet.transferPending;
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
                        onClick={() => {
                            dispatch(fetchBalance.started({ account: address, ecosystem }));
                            loadHistory(historyFilter);
                            loadUtxoHistory(null);
                        }}
                    >
                        {wallet.balancePending && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        <FormattedMessage id="wallet.balance.refresh" defaultMessage="Refresh" />
                    </Button>
                </div>

                {/* Announced to screen readers: loading, failures, finished transfers */}
                <div role="status" aria-live="polite">
                    {!balance && !wallet.balanceError && (
                        <p>
                            <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                            <FormattedMessage id="wallet.balance.loading" defaultMessage="Loading balance…" />
                        </p>
                    )}
                    {wallet.balanceError && (
                        <Alert variant={balance ? 'warning' : 'danger'}>
                            <FormattedMessage id={`wallet.balance.error.${walletErrorCode(wallet.balanceError)}`} defaultMessage="Could not load the balance." />
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
                                <>
                                    <div className="small font-monospace text-break">
                                        <FormattedMessage id="wallet.done.hash" defaultMessage="Transaction {hash}" values={{ hash: last.result.hash }} />
                                        <CopyToClipboard text={last.result.hash}>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="wallet__history-copy align-baseline icon-docs"
                                                aria-label={intl.formatMessage({ id: 'wallet.history.copyHash', defaultMessage: 'Copy the transaction hash' })}
                                                title={intl.formatMessage({ id: 'wallet.history.copyHash', defaultMessage: 'Copy the transaction hash' })}
                                            />
                                        </CopyToClipboard>
                                    </div>
                                    {/* Said where the transfer happens: where it will be listed, if anywhere */}
                                    {'utxo' === last.call.transfer.type && (
                                        <div className="small mt-1">
                                            {explorer
                                                ? <FormattedMessage id="wallet.done.utxo.history" defaultMessage="It is listed under UTXO transfers below once the block explorer has indexed it, usually within a minute. This page looks for it a few times; if it is not there by then, press Refresh." />
                                                : <FormattedMessage id="wallet.done.utxo.unlisted" defaultMessage="This network has no block explorer to list UTXO transfers: keep the transaction hash." />}
                                        </div>
                                    )}
                                </>
                            )}
                        </Alert>
                    )}
                </div>

                {isDemo && (
                    <Alert variant="info">
                        <FormattedMessage
                            id="wallet.demo"
                            defaultMessage="The demo account's key is public, so it can only view balances and history. Sign in with your own account to send tokens."
                        />
                    </Alert>
                )}

                {balance && (
                    <>
                        <Row xs={1} lg={3} className="g-3 mb-4">
                            {BALANCES.map(item => (
                                <Col key={item.key}>
                                    <Card className="h-100">
                                        <Card.Body className="wallet__balance">
                                            <div className="wallet__hint small">
                                                <FormattedMessage id={item.id} defaultMessage={item.defaultMessage} />
                                            </div>
                                            <BalanceAmount amount={formatAmount(balance.value[item.key], balance.value.digits)} symbol={balance.value.token_symbol} />
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

                        <History
                            filter={historyFilter}
                            entries={history ? history.entries : null}
                            more={history ? history.more : 0}
                            pending={wallet.historyPending}
                            error={wallet.historyError}
                            digits={balance.value.digits}
                            symbol={balance.value.token_symbol}
                            onFilter={filter => loadHistory(filter)}
                            onMore={() => {
                                const shown = history && history.entries;
                                if (shown && shown.length > 0) {
                                    loadHistory(historyFilter, shown[shown.length - 1].id);
                                }
                            }}
                            onRetry={() => dispatch(fetchHistory.started(wallet.historyRetry || { account: address, ecosystem, filter: historyFilter, before: null }))}
                        />

                        <UtxoHistory
                            explorer={explorerHost}
                            entries={utxoHistory ? utxoHistory.entries : null}
                            more={!!utxoHistory && null !== utxoHistory.next}
                            checked={utxoHistory ? utxoHistory.checked : 0}
                            total={utxoHistory ? utxoHistory.total : 0}
                            incomplete={utxoHistory ? utxoHistory.incomplete : []}
                            pending={wallet.utxoHistoryPending}
                            error={wallet.utxoHistoryError}
                            digits={balance.value.digits}
                            symbol={balance.value.token_symbol}
                            onMore={() => {
                                if (utxoHistory && utxoHistory.next) {
                                    loadUtxoHistory(utxoHistory.next);
                                }
                            }}
                            onRetry={() => dispatch(fetchUtxoHistory.started(wallet.utxoHistoryRetry || { account: address, ecosystem, cursor: null }))}
                        />
                    </>
                )}
            </div>
        </StyledWallet>
    );
};

export default Wallet;
