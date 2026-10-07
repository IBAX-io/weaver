/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Spinner } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import CopyToClipboard from 'react-copy-to-clipboard';
import { formatAmount } from 'lib/tx/amount';
import { THistoryEntry, THistoryFilter } from 'modules/wallet/history';
import { walletErrorCode } from 'modules/wallet/actions';

interface Props {
    filter: THistoryFilter;
    // Newest first; null until the first page of this filter is in
    entries: readonly THistoryEntry[] | null;
    // Rows older than the ones shown
    more: number;
    pending: boolean;
    error: string | null;
    // The ecosystem's token, as the balance gives it
    digits: number;
    symbol: string;
    onFilter: (filter: THistoryFilter) => void;
    onMore: () => void;
}

const FILTERS: { filter: THistoryFilter, id: string, defaultMessage: string }[] = [
    { filter: 'transfers', id: 'wallet.history.filter.transfers', defaultMessage: 'Activity' },
    { filter: 'fees', id: 'wallet.history.filter.fees', defaultMessage: 'Fees' },
    { filter: 'all', id: 'wallet.history.filter.all', defaultMessage: 'All' }
];

const EMPTY: { [F in THistoryFilter]: { id: string, defaultMessage: string } } = {
    transfers: { id: 'wallet.history.empty.transfers', defaultMessage: 'No transfers or moves yet.' },
    fees: { id: 'wallet.history.empty.fees', defaultMessage: 'No fees yet.' },
    all: { id: 'wallet.history.empty.all', defaultMessage: 'Nothing yet.' }
};

// What happened, in a line
const Description: React.FC<{ entry: THistoryEntry }> = ({ entry }) => {
    switch (entry.kind) {
        case 'move':
            return 'utxo' === entry.to
                ? <FormattedMessage id="wallet.history.move.toUTXO" defaultMessage="Moved to the UTXO balance" />
                : 'account' === entry.to
                    ? <FormattedMessage id="wallet.history.move.toAccount" defaultMessage="Moved to the account balance" />
                    : <FormattedMessage id="wallet.history.move" defaultMessage="Moved between balances" />;
        case 'created':
            return <FormattedMessage id="wallet.history.created" defaultMessage="Account created" />;
        default: {
            const fee = 'fee' === entry.kind;
            if ('self' === entry.direction) {
                return fee
                    ? <FormattedMessage id="wallet.history.fee.self" defaultMessage="Fee paid to yourself" />
                    : <FormattedMessage id="wallet.history.transfer.self" defaultMessage="Sent to yourself" />;
            }
            // Only tokens going out can lack an account: sent to account 0, burnt
            if (!entry.counterparty) {
                return <FormattedMessage id="wallet.history.burnt" defaultMessage="Burnt" />;
            }
            const address = <span className="font-monospace">{entry.counterparty}</span>;
            return 'out' === entry.direction
                ? (fee
                    ? <FormattedMessage id="wallet.history.fee.out" defaultMessage="Fee paid to {address}" values={{ address }} />
                    : <FormattedMessage id="wallet.history.transfer.out" defaultMessage="Sent to {address}" values={{ address }} />)
                : (fee
                    ? <FormattedMessage id="wallet.history.fee.in" defaultMessage="Fee received from {address}" values={{ address }} />
                    : <FormattedMessage id="wallet.history.transfer.in" defaultMessage="Received from {address}" values={{ address }} />);
        }
    }
};

// Tokens out are "\u2212", in "+" (an account's creation brings tokens in, when it brings any); a
// move between the account's own balances and anything to itself changes neither way
const sign = (entry: THistoryEntry) => 'created' === entry.kind ? '+'
    : 'transfer' !== entry.kind && 'fee' !== entry.kind ? ''
        : 'out' === entry.direction ? '\u2212' : 'in' === entry.direction ? '+' : '';

// How long a copied hash shows its check mark
const COPIED_MS = 2000;

// One number however narrow the card: it may only break at its decimal point
const Amount: React.FC<{ entry: THistoryEntry, digits: number, symbol: string }> = ({ entry, digits, symbol }) => {
    const [integer, fraction] = formatAmount(entry.amount, digits).split('.');
    const token = <>{' '}<small>{symbol}</small></>;
    return fraction
        ? <><span className="text-nowrap">{sign(entry)}{integer}</span><wbr /><span className="text-nowrap">.{fraction}{token}</span></>
        : <span className="text-nowrap">{sign(entry)}{integer}{token}</span>;
};

const History: React.FC<Props> = props => {
    const intl = useIntl();
    const list = useRef<HTMLUListElement>(null);
    const title = useRef<HTMLHeadingElement>(null);
    // The row whose hash was just copied
    const [copied, setCopied] = useState<string | null>(null);
    useEffect(() => {
        if (null === copied) {
            return undefined;
        }
        const timer = setTimeout(() => setCopied(null), COPIED_MS);
        return () => clearTimeout(timer);
    }, [copied]);
    // The row "Show older" was pressed after: the first new row takes the keyboard focus, so it
    // does not fall back to the page's top when the button goes away
    const focusAfter = useRef<number | null>(null);
    const shown = props.entries ? props.entries.length : 0;

    useEffect(() => {
        if (null !== focusAfter.current && !props.pending && list.current) {
            const next = list.current.children[focusAfter.current] as HTMLElement | undefined;
            focusAfter.current = null;
            if (next) {
                next.focus();
            }
        }
    }, [shown, props.pending]);

    // The button stays focusable while the page loads (a disabled button drops the focus)
    const more = () => {
        if (!props.pending) {
            focusAfter.current = shown;
            props.onMore();
        }
    };
    // Try again what failed: the rows older than the ones shown, or the first page. The focus goes to
    // the heading, as the alert holding the button goes away
    const retry = () => {
        if (title.current) {
            title.current.focus();
        }
        if (props.entries && props.entries.length > 0 && props.more > 0) {
            more();
        }
        else {
            props.onFilter(props.filter);
        }
    };
    const copyHash = intl.formatMessage({ id: 'wallet.history.copyHash', defaultMessage: 'Copy the transaction hash' });
    const copiedHash = intl.formatMessage({ id: 'alert.clipboard.copied', defaultMessage: 'Copied to clipboard' });

    return (
        <Card className="mt-4">
            <Card.Body>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <Card.Title as="h2" className="h5 mb-0" tabIndex={-1} ref={title}>
                        <FormattedMessage id="wallet.history" defaultMessage="History" />
                        {props.pending && props.entries && (
                            <Spinner as="span" animation="border" size="sm" className="ms-2" aria-hidden="true" />
                        )}
                    </Card.Title>
                    <ButtonGroup size="sm" className="wallet__history-filter" aria-label={intl.formatMessage({ id: 'wallet.history.filter', defaultMessage: 'Filter history' })}>
                        {FILTERS.map(item => (
                            <Button
                                key={item.filter}
                                variant={props.filter === item.filter ? 'primary' : 'outline-primary'}
                                aria-pressed={props.filter === item.filter}
                                onClick={() => props.onFilter(item.filter)}
                            >
                                <FormattedMessage id={item.id} defaultMessage={item.defaultMessage} />
                            </Button>
                        ))}
                    </ButtonGroup>
                </div>
                {'fees' !== props.filter && (
                    <p className="wallet__hint small">
                        <FormattedMessage
                            id="wallet.history.utxoNote"
                            defaultMessage="UTXO transfers between accounts, sent or received, are not listed, because the node keeps no history of them. Moves between your own balances and transfers made by application contracts (such as sending coins or rewards) are listed; fees are under Fees."
                        />
                    </p>
                )}

                <div role="status" aria-live="polite">
                    {props.error && (
                        <Alert variant={props.entries ? 'warning' : 'danger'}>
                            <FormattedMessage id={`wallet.history.error.${walletErrorCode(props.error)}`} defaultMessage="The node reported an error while loading the history." />
                            {' '}
                            <Button variant="link" size="sm" className="p-0 align-baseline" onClick={retry}>
                                <FormattedMessage id="wallet.history.retry" defaultMessage="Try again" />
                            </Button>
                        </Alert>
                    )}
                    {!props.entries && !props.error && (
                        <p>
                            <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                            <FormattedMessage id="wallet.history.loading" defaultMessage="Loading history…" />
                        </p>
                    )}
                    {null !== copied && <span className="visually-hidden">{copiedHash}</span>}
                    {props.entries && 0 === props.entries.length && (
                        <p className="wallet__hint">
                            <FormattedMessage {...EMPTY[props.filter]} />
                        </p>
                    )}
                </div>

                {props.entries && props.entries.length > 0 && (
                    <ul className="list-unstyled mb-0" ref={list}>
                        {props.entries.map(entry => (
                            <li key={entry.id} className="wallet__history-entry" tabIndex={-1}>
                                <div className="wallet__history-main">
                                    <div className="wallet__history-what"><Description entry={entry} /></div>
                                    {'fee' === entry.kind && entry.penalty && (
                                        <Badge bg="warning" text="dark" className="wallet__history-penalty">
                                            <FormattedMessage id="wallet.history.penalty" defaultMessage="The transaction failed; the fee was charged" />
                                        </Badge>
                                    )}
                                    {/* The contract's own text: labelled as such, and kept from reordering what is around it */}
                                    {entry.comment && 'move' !== entry.kind && (
                                        <div className="wallet__hint small wallet__history-comment">
                                            <FormattedMessage id="wallet.history.comment" defaultMessage="Note" />
                                            {': '}
                                            <bdi>{entry.comment}</bdi>
                                        </div>
                                    )}
                                    <div className="wallet__hint small">
                                        <time dateTime={new Date(entry.time).toISOString()}>
                                            {intl.formatDate(entry.time, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </time>
                                        {' · '}
                                        <FormattedMessage id="wallet.history.block" defaultMessage="Block {block}" values={{ block: entry.blockID }} />
                                        {entry.hash && (
                                            <>
                                                {' · '}
                                                {/* The short hash and its copy button on one line */}
                                                <span className="text-nowrap">
                                                    <span className="font-monospace wallet__history-hash" title={entry.hash}>
                                                        {`${entry.hash.slice(0, 8)}…${entry.hash.slice(-6)}`}
                                                    </span>
                                                    <CopyToClipboard text={entry.hash} onCopy={() => setCopied(entry.id)}>
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className={`wallet__history-copy align-baseline ${copied === entry.id ? 'icon-check' : 'icon-docs'}`}
                                                            aria-label={copied === entry.id ? copiedHash : copyHash}
                                                            title={copied === entry.id ? copiedHash : copyHash}
                                                        />
                                                    </CopyToClipboard>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* An account's creation moves no tokens */}
                                {!('created' === entry.kind && /^0+$/.test(entry.amount)) && (
                                    <div className="wallet__history-amount">
                                        <Amount entry={entry} digits={props.digits} symbol={props.symbol} />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {props.entries && props.more > 0 && (
                    <Button variant="link" size="sm" className="mt-2 px-0" aria-disabled={props.pending} aria-busy={props.pending} onClick={more}>
                        {props.pending && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        <FormattedMessage id="wallet.history.more" defaultMessage="Show older ({more})" values={{ more: props.more }} />
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

export default History;
