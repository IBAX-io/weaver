/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect } from 'react';
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { useAppDispatch, useAppSelector } from 'lib/hooks';
import { fetchBalance, fetchHistory, fetchUtxoHistory, ISendTransferCall, sendTransfer, walletErrorCode } from 'modules/wallet/actions';
import { DEFAULT_HISTORY_FILTER, THistoryFilter } from 'modules/wallet/history';
import { IExplorerCursor } from 'modules/wallet/utxoHistory';
import { sameOwner } from 'modules/wallet/reducer';
import { explorerAllowed, explorerConsent, sessionExplorer, sessionNetwork } from 'modules/wallet/selectors';
import { allowExplorer } from 'modules/storage/actions';
import { formatAddress } from 'lib/crypto/address';
import { formatAmount } from 'lib/tx/amount';
import StyledWallet from './StyledWallet';
import UtxoTransferForm from './UtxoTransferForm';
import TransferSelfForm from './TransferSelfForm';
import BalanceAmount from './BalanceAmount';
import History from './History';
import UtxoHistory from './UtxoHistory';
import { CopyHashButton, useCopied } from './HistoryParts';

const BALANCES = [
    { key: 'amount', id: 'wallet.balance.account', defaultMessage: 'Account balance' },
    { key: 'utxo', id: 'wallet.balance.utxo', defaultMessage: 'UTXO balance' },
    { key: 'total', id: 'wallet.balance.total', defaultMessage: 'Total' }
] as const;

// The host of a block explorer's address; null when it has none, or none that can be read
const hostOf = (explorer: string | null) => {
    try {
        return explorer ? new URL(explorer).host : null;
    }
    catch (e) {
        return null;
    }
};

const Wallet: React.FC = () => {
    const dispatch = useAppDispatch();
    // Whether the hash of the transfer just done was copied, for a moment
    const [copied, setCopied] = useCopied();
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
    // The block explorer the network names (its host is shown: the address is sent there), and
    // whether the user agreed to that
    const network = useAppSelector(sessionNetwork);
    const explorer = useAppSelector(sessionExplorer);
    const explorerHost = hostOf(explorer);
    const allowed = useAppSelector(explorerAllowed) && null !== explorerHost;

    useEffect(() => {
        if (address && ecosystem) {
            dispatch(fetchBalance.started({ account: address, ecosystem }));
            dispatch(fetchHistory.started({ account: address, ecosystem, filter: DEFAULT_HISTORY_FILTER, before: null }));
        }
    }, [dispatch, address, ecosystem]);
    useEffect(() => {
        if (address && ecosystem && allowed) {
            dispatch(fetchUtxoHistory.started({ account: address, ecosystem, cursor: null }));
        }
    }, [dispatch, address, ecosystem, allowed]);

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
    const token = balance ? { digits: balance.value.digits, symbol: balance.value.token_symbol } : null;
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
                            if (allowed) {
                                loadUtxoHistory(null);
                            }
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
                                        <CopyHashButton hash={last.result.hash} copied={copied === last.result.hash} onCopy={() => setCopied(last.result.hash)} />
                                    </div>
                                    {/* Said where the transfer happens: where it will be listed, if anywhere */}
                                    {'utxo' === last.call.transfer.type && (
                                        <div className="small mt-1">
                                            {!explorerHost
                                                ? <FormattedMessage id="wallet.done.utxo.unlisted" defaultMessage="This network has no block explorer to list UTXO transfers: keep the transaction hash." />
                                                : allowed
                                                    ? <FormattedMessage id="wallet.done.utxo.history" defaultMessage="It is listed under UTXO transfers below once the block explorer has indexed it. This page looks for it again for about a minute; if it is not there by then, press Refresh." />
                                                    : <FormattedMessage id="wallet.done.utxo.ask" defaultMessage="To see it listed, look up UTXO transfers below." />}
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
                    </>
                )}

                {/* Not kept behind the balance: it only gives the amounts their digits and symbol */}
                <History
                    filter={historyFilter}
                    entries={history ? history.entries : null}
                    more={history ? history.more : 0}
                    pending={wallet.historyPending}
                    pendingMore={wallet.historyPendingMore}
                    error={wallet.historyError}
                    token={token}
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
                    allowed={allowed}
                    onAllow={() => dispatch(allowExplorer(explorerConsent(network.uuid, explorer)))}
                    entries={utxoHistory ? utxoHistory.entries : null}
                    more={!!utxoHistory && null !== utxoHistory.next}
                    checked={utxoHistory ? utxoHistory.checked : 0}
                    total={utxoHistory ? utxoHistory.total : 0}
                    incomplete={utxoHistory ? utxoHistory.incomplete : []}
                    pending={wallet.utxoHistoryPending}
                    pendingMore={wallet.utxoHistoryPendingMore}
                    error={wallet.utxoHistoryError}
                    token={token}
                    onMore={() => {
                        if (utxoHistory && utxoHistory.next) {
                            loadUtxoHistory(utxoHistory.next);
                        }
                    }}
                    onRetry={() => dispatch(fetchUtxoHistory.started(wallet.utxoHistoryRetry || { account: address, ecosystem, cursor: null }))}
                />
            </div>
        </StyledWallet>
    );
};

export default Wallet;
