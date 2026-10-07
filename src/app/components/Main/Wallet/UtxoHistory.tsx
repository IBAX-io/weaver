/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useRef } from 'react';
import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { E_NO_EXPLORER, walletErrorCode } from 'modules/wallet/actions';
import { IIncompleteBlock, IUncheckedTransfer, IUtxoTransfer, TUtxoHistoryEntry } from 'modules/wallet/utxoHistory';
import { Amount, CopiedStatus, HashCopy, MINUS, useCopied, useMoreFocus } from './HistoryParts';

interface Props {
    // The block explorer's host, which the account's address is sent to; null when the network has none
    explorer: string | null;
    // Newest first; null until the first page is in
    entries: readonly TUtxoHistoryEntry[] | null;
    // Whether the explorer's list goes on past the transactions gone through
    more: boolean;
    // The account's transactions of every kind gone through in the explorer, of how many it counts
    checked: number;
    total: number;
    // Blocks too large to be read whole
    incomplete: readonly IIncompleteBlock[];
    pending: boolean;
    error: string | null;
    // The ecosystem's token, as the balance gives it
    digits: number;
    symbol: string;
    onMore: () => void;
    // Sends again the request that failed
    onRetry: () => void;
}

// Out "−", in "+"; to oneself, or a failed transfer that moved nothing, neither
const sign = (transfer: IUtxoTransfer) => transfer.failed ? ''
    : 'out' === transfer.direction ? MINUS : 'in' === transfer.direction ? '+' : '';

const isUnchecked = (entry: TUtxoHistoryEntry): entry is IUncheckedTransfer => 'problem' in entry;

// Blocks listed in the warning itself up to this many; more go in a list to open
const INCOMPLETE_LISTED = 3;

// Inside the polite region: styled as a warning, without the alert role, so it is read once
const Incomplete: React.FC<{ blocks: readonly IIncompleteBlock[] }> = ({ blocks }) => (
    <div className="alert alert-warning small mb-2">
        <FormattedMessage
            id="wallet.utxoHistory.incomplete"
            defaultMessage="{count, plural, =1 {Block {first} holds} other {# blocks, from {first} to {last}, hold}} more of the account's transactions than the block explorer lists at once, so some transfers in {count, plural, =1 {it} other {them}} may be missing."
            values={{ count: blocks.length, first: blocks[0].blockID, last: blocks[blocks.length - 1].blockID }}
        />
        {blocks.length > INCOMPLETE_LISTED ? (
            <details className="mt-1">
                <summary><FormattedMessage id="wallet.utxoHistory.incomplete.blocks" defaultMessage="Blocks" /></summary>
                <span className="font-monospace">{blocks.map(block => block.blockID).join(', ')}</span>
            </details>
        ) : blocks.length > 2 && (
            <span className="font-monospace">{' ('}{blocks.map(block => block.blockID).join(', ')}{')'}</span>
        )}
    </div>
);

const Description: React.FC<{ transfer: IUtxoTransfer }> = ({ transfer }) => {
    const address = <span className="font-monospace">{transfer.counterparty}</span>;
    return 'self' === transfer.direction
        ? <FormattedMessage id="wallet.history.transfer.self" defaultMessage="Sent to yourself" />
        : 'out' === transfer.direction
            ? <FormattedMessage id="wallet.history.transfer.out" defaultMessage="Sent to {address}" values={{ address }} />
            : <FormattedMessage id="wallet.history.transfer.in" defaultMessage="Received from {address}" values={{ address }} />;
};

// The account's UTXO transfers between accounts, sent or received: found in the network's block
// explorer, each one looked up in the node (modules/wallet/utxoHistory)
const UtxoHistory: React.FC<Props> = props => {
    const intl = useIntl();
    const title = useRef<HTMLHeadingElement>(null);
    const [copied, setCopied] = useCopied();
    const { list, more } = useMoreFocus(props.entries ? props.entries.length : 0, props.pending, props.onMore, title);
    // The alert holding "Try again" goes away: the focus goes to the heading
    const retry = () => {
        if (title.current) {
            title.current.focus();
        }
        props.onRetry();
    };
    const heading = <FormattedMessage id="wallet.utxoHistory" defaultMessage="UTXO transfers" />;

    if (E_NO_EXPLORER === props.error || null === props.explorer) {
        return (
            <Card className="mt-4">
                <Card.Body>
                    <Card.Title as="h2" className="h5">{heading}</Card.Title>
                    <p className="wallet__hint mb-0">
                        <FormattedMessage
                            id="wallet.utxoHistory.noExplorer"
                            defaultMessage="This network has no block explorer configured, and the node keeps no list of UTXO transfers, so they cannot be shown here. Keep the transaction hash of the transfers you send."
                        />
                    </p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <Card.Body>
                <Card.Title as="h2" className="h5" tabIndex={-1} ref={title}>
                    {heading}
                    {props.pending && props.entries && (
                        <Spinner as="span" animation="border" size="sm" className="ms-2" aria-hidden="true" />
                    )}
                </Card.Title>
                <p className="wallet__hint small mb-1">
                    <FormattedMessage
                        id="wallet.utxoHistory.source"
                        defaultMessage="UTXO transfers between accounts, sent or received. The node keeps no list of them, so they are found through the network's block explorer, and the node confirms each one's sender, recipient and amount. A transfer the explorer does not list is not shown."
                    />
                </p>
                <p className="wallet__hint small">
                    <FormattedMessage
                        id="wallet.utxoHistory.privacy"
                        defaultMessage="To find them, this account's address is sent to {explorer}."
                        values={{ explorer: <span className="text-nowrap">{props.explorer}</span> }}
                    />
                </p>

                {/* An alert announces itself: outside the polite region, not read twice */}
                {props.error && (
                    <Alert variant={props.entries ? 'warning' : 'danger'}>
                        <FormattedMessage id={`wallet.utxoHistory.error.${walletErrorCode(props.error)}`} defaultMessage="The block explorer or the node reported an error while loading the UTXO transfers." />
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
                            <FormattedMessage id="wallet.utxoHistory.loading" defaultMessage="Looking for UTXO transfers… (this can take a few seconds when the account has many transactions)" />
                        </p>
                    )}
                    {props.entries && 0 === props.entries.length && (
                        // With more to look through, it also says how much was: what the button goes on from
                        <p className="wallet__hint" id={props.more ? 'wallet-utxo-checked' : undefined}>
                            {props.more
                                ? <FormattedMessage id="wallet.utxoHistory.noneYet" defaultMessage="None among the latest {checked, number} of the account's {total, number} transactions in this ecosystem." values={{ checked: props.checked, total: props.total }} />
                                : <FormattedMessage id="wallet.utxoHistory.none" defaultMessage="The block explorer lists no UTXO transfers of this account." />}
                        </p>
                    )}
                    {props.entries && props.entries.length > 0 && props.more && (
                        <p className="wallet__hint small mb-0" id="wallet-utxo-checked">
                            <FormattedMessage
                                id="wallet.utxoHistory.checked"
                                defaultMessage="Looked through {checked, number} of the account's {total, number} transactions in this ecosystem"
                                values={{ checked: props.checked, total: props.total }}
                            />
                        </p>
                    )}
                    {props.incomplete.length > 0 && <Incomplete blocks={props.incomplete} />}
                    <CopiedStatus copied={null !== copied} />
                </div>

                {props.entries && props.entries.length > 0 && (
                    <ul className="list-unstyled mb-0" ref={list}>
                        {props.entries.map(entry => (
                            <li key={entry.hash} className="wallet__history-entry" tabIndex={-1}>
                                <div className="wallet__history-main">
                                    <div className="wallet__history-what">
                                        {isUnchecked(entry)
                                            ? <FormattedMessage id="wallet.utxoHistory.unchecked" defaultMessage="Listed by the block explorer" />
                                            : <Description transfer={entry} />}
                                    </div>
                                    {isUnchecked(entry) && (
                                        <Badge
                                            bg={'mismatch' === entry.problem ? 'warning' : 'secondary'}
                                            text={'mismatch' === entry.problem ? 'dark' : undefined}
                                            className="wallet__history-penalty"
                                        >
                                            {'mismatch' === entry.problem
                                                ? <FormattedMessage id="wallet.utxoHistory.mismatch" defaultMessage="The node records it otherwise: no details shown" />
                                                : <FormattedMessage id="wallet.utxoHistory.unconfirmed" defaultMessage="Not confirmed by the node yet" />}
                                        </Badge>
                                    )}
                                    {!isUnchecked(entry) && entry.failed && (
                                        <Badge bg="warning" text="dark" className="wallet__history-penalty">
                                            <FormattedMessage id="wallet.utxoHistory.failed" defaultMessage="The transaction failed; no transfer took place" />
                                        </Badge>
                                    )}
                                    {!isUnchecked(entry) && entry.comment && (
                                        <div className="wallet__hint small wallet__history-comment">
                                            <FormattedMessage id="wallet.history.comment" defaultMessage="Note" />
                                            {': '}
                                            <bdi>{entry.comment}</bdi>
                                        </div>
                                    )}
                                    <div className="wallet__hint small">
                                        {!isUnchecked(entry) && (
                                            <>
                                                <time dateTime={new Date(entry.time).toISOString()}>
                                                    {intl.formatDate(entry.time, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </time>
                                                {' · '}
                                            </>
                                        )}
                                        <FormattedMessage id="wallet.history.block" defaultMessage="Block {block}" values={{ block: entry.blockID }} />
                                        {' · '}
                                        <HashCopy hash={entry.hash} copied={copied === entry.hash} onCopy={() => setCopied(entry.hash)} />
                                    </div>
                                </div>
                                {/* Only what the node confirmed has an amount; a failed transfer's moved nothing */}
                                {!isUnchecked(entry) && (
                                    <div className={`wallet__history-amount${entry.failed ? ' wallet__history-amount_void' : ''}`}>
                                        <Amount amount={entry.amount} sign={sign(entry)} digits={props.digits} symbol={props.symbol} />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {props.entries && props.more && (
                    <Button
                        variant="link"
                        size="sm"
                        className="mt-2 px-0"
                        aria-disabled={props.pending}
                        aria-busy={props.pending}
                        aria-describedby="wallet-utxo-checked"
                        onClick={more}
                    >
                        {props.pending && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
                        <FormattedMessage id="wallet.utxoHistory.more" defaultMessage="Look further back" />
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

export default UtxoHistory;
