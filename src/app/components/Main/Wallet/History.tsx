/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useRef } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Spinner } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { THistoryEntry, THistoryFilter } from 'modules/wallet/history';
import { walletErrorCode } from 'modules/wallet/actions';
import { Amount, CopiedStatus, HashCopy, MINUS, useCopied, useMoreFocus } from './HistoryParts';

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
    // Sends again the request that failed
    onRetry: () => void;
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

// Tokens out are "−", in "+" (an account's creation brings tokens in, when it brings any); a move
// between the account's own balances and anything to itself changes neither way
const sign = (entry: THistoryEntry) => 'created' === entry.kind ? '+'
    : 'transfer' !== entry.kind && 'fee' !== entry.kind ? ''
        : 'out' === entry.direction ? MINUS : 'in' === entry.direction ? '+' : '';

const History: React.FC<Props> = props => {
    const intl = useIntl();
    const title = useRef<HTMLHeadingElement>(null);
    // The row whose hash was just copied
    const [copied, setCopied] = useCopied();
    const { list, more } = useMoreFocus(props.entries ? props.entries.length : 0, props.pending, props.onMore, title);
    // The alert holding "Try again" goes away: the focus goes to the heading
    const retry = () => {
        if (title.current) {
            title.current.focus();
        }
        props.onRetry();
    };

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
                            defaultMessage="UTXO transfers between accounts are listed separately, under UTXO transfers. Moves between your own balances and transfers made by application contracts (such as sending coins or rewards) are listed here; fees are under Fees."
                        />
                    </p>
                )}

                {/* An alert announces itself: outside the polite region, not read twice */}
                {props.error && (
                    <Alert variant={props.entries ? 'warning' : 'danger'}>
                        <FormattedMessage id={`wallet.history.error.${walletErrorCode(props.error)}`} defaultMessage="The node reported an error while loading the history." />
                        {' '}
                        <Button variant="link" size="sm" className="p-0 align-baseline" onClick={retry}>
                            <FormattedMessage id="wallet.history.retry" defaultMessage="Try again" />
                        </Button>
                    </Alert>
                )}

                <div role="status" aria-live="polite">
                    {!props.entries && !props.error && (
                        <p>
                            <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                            <FormattedMessage id="wallet.history.loading" defaultMessage="Loading history…" />
                        </p>
                    )}
                    <CopiedStatus copied={null !== copied} />
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
                                                <HashCopy hash={entry.hash} copied={copied === entry.id} onCopy={() => setCopied(entry.id)} />
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* An account's creation moves no tokens */}
                                {!('created' === entry.kind && /^0+$/.test(entry.amount)) && (
                                    <div className="wallet__history-amount">
                                        <Amount amount={entry.amount} sign={sign(entry)} digits={props.digits} symbol={props.symbol} />
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
