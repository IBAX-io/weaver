/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useRef } from 'react';
import { Badge, Button, Card, Spinner } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { E_NO_EXPLORER, walletErrorCode } from 'modules/wallet/actions';
import { IIncompleteBlock } from 'modules/wallet/utxoHistory';
import { IUncheckedTransfer, IUtxoTransfer, TUtxoHistoryEntry } from 'modules/wallet/utxoTransfer';
import {
    Amount, CopiedStatus, directionSign, EntryMeta, HeadingSpinner, IToken, ListError, ListUpdating, MoreButton, TransferDescription, useAfterAWhile, useCopied, useFocusKept, useMoreFocus, useRetry
} from './HistoryParts';

interface Props {
    // The block explorer's host, which the account's address is sent to; null when the network has none
    explorer: string | null;
    // Whether the user agreed to send account addresses to it (asked once for each network)
    allowed: boolean;
    onAllow: () => void;
    // Newest first; null until the first page is in
    entries: readonly TUtxoHistoryEntry[] | null;
    // Whether the explorer's list goes on past the transactions gone through
    more: boolean;
    // The account's transactions of every kind gone through in the explorer, of how many it counts
    checked: number;
    total: number;
    // Blocks no one request to the explorer could hold whole
    incomplete: readonly IIncompleteBlock[];
    pending: boolean;
    // The page pending is an older one (not the newest, loaded again)
    pendingMore: boolean;
    error: string | null;
    token: IToken | null;
    onMore: () => void;
    // Sends again the request that failed
    onRetry: () => void;
}

// Out "−", in "+"; to oneself, or a failed transfer that moved nothing, neither
const sign = (transfer: IUtxoTransfer) => transfer.failed ? '' : directionSign(transfer.direction);

const isUnchecked = (entry: TUtxoHistoryEntry): entry is IUncheckedTransfer => 'problem' in entry;

// Blocks listed on a line up to this many; more go in a list to open
const INCOMPLETE_LISTED = 3;

// Blocks the explorer could not list whole, lowest first. Outside the polite region: it holds a
// control, and a page more would read the whole warning out again.
const Incomplete: React.FC<{ blocks: readonly IIncompleteBlock[] }> = ({ blocks }) => {
    const ids = blocks.map(block => Number(block.blockID)).sort((a, b) => a - b);
    const list = <span className="font-monospace">{ids.join(', ')}</span>;
    return (
        <div className="alert alert-warning small">
            <FormattedMessage
                id="wallet.utxoHistory.incomplete"
                defaultMessage="The block explorer could not list all of the account's transactions in {count, plural, =1 {block {first}} other {# blocks between {first} and {last}}}, so some transfers in {count, plural, =1 {it} other {them}} may be missing."
                values={{ count: ids.length, first: ids[0], last: ids[ids.length - 1] }}
            />
            {ids.length > INCOMPLETE_LISTED ? (
                <details className="mt-1">
                    <summary><FormattedMessage id="wallet.utxoHistory.incomplete.blocks" defaultMessage="Blocks" /></summary>
                    {list}
                </details>
            ) : ids.length > 2 && (
                <div className="mt-1">
                    <FormattedMessage id="wallet.utxoHistory.incomplete.blocks" defaultMessage="Blocks" />
                    {': '}
                    {list}
                </div>
            )}
        </div>
    );
};

// The account's UTXO transfers between accounts, sent or received: found in the network's block
// explorer, each one looked up in the node (modules/wallet/utxoHistory, utxoTransfer)
const UtxoHistory: React.FC<Props> = props => {
    const title = useRef<HTMLHeadingElement>(null);
    const [copied, setCopied] = useCopied();
    const { list, more } = useMoreFocus(props.entries ? props.entries.length : 0, props.pending, props.onMore, title);
    useFocusKept(list, props.entries, title);
    const retry = useRetry(title, props.onRetry);
    // Said after the history above has said it is loading
    const longLoad = useAfterAWhile(!props.entries && !props.error);
    const heading = <FormattedMessage id="wallet.utxoHistory" defaultMessage="UTXO transfers" />;
    const source = (
        <p className="wallet__hint small mb-1">
            <FormattedMessage
                id="wallet.utxoHistory.source"
                defaultMessage="UTXO transfers between accounts, sent or received. The node keeps no list of them, so they are looked up in the network's block explorer, and each one it lists is looked up in the node: a sender, recipient and amount shown are the node's, and one the node does not confirm shows only its hash. A transfer the explorer does not list is not shown."
            />
        </p>
    );
    const host = <span className="text-nowrap">{props.explorer}</span>;

    if (E_NO_EXPLORER === props.error || null === props.explorer) {
        return (
            <Card className="mt-4">
                <Card.Body>
                    <Card.Title as="h2" className="h5">{heading}</Card.Title>
                    <p className="wallet__hint mb-0">
                        <FormattedMessage
                            id="wallet.utxoHistory.noExplorer"
                            defaultMessage="This network has no block explorer to look UTXO transfers up in, and the node keeps no list of them, so they cannot be shown here. Keep the transaction hash of the transfers you send."
                        />
                    </p>
                </Card.Body>
            </Card>
        );
    }

    // Nothing is sent to the explorer before the user agrees
    if (!props.allowed) {
        return (
            <Card className="mt-4">
                <Card.Body>
                    <Card.Title as="h2" className="h5">{heading}</Card.Title>
                    {source}
                    <p className="wallet__hint small">
                        <FormattedMessage
                            id="wallet.utxoHistory.ask"
                            defaultMessage="Looking them up sends this account's address to {explorer}, which can see it together with your IP address. You are asked once for this network, and again if its block explorer changes."
                            values={{ explorer: host }}
                        />
                    </p>
                    <Button variant="outline-primary" size="sm" onClick={props.onAllow}>
                        <FormattedMessage id="wallet.utxoHistory.allow" defaultMessage="Look up UTXO transfers" />
                    </Button>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <Card.Body>
                <Card.Title as="h2" className="h5" tabIndex={-1} ref={title}>
                    {heading}
                    <HeadingSpinner shown={props.pending && !!props.entries} />
                </Card.Title>
                {source}
                <p className="wallet__hint small">
                    <FormattedMessage
                        id="wallet.utxoHistory.privacy"
                        defaultMessage="This account's address is sent to {explorer} to look them up."
                        values={{ explorer: host }}
                    />
                </p>

                {props.error && (
                    <ListError
                        shown={!!props.entries}
                        onRetry={retry}
                        message={<FormattedMessage id={`wallet.utxoHistory.error.${walletErrorCode(props.error)}`} defaultMessage="The block explorer or the node reported an error while loading the UTXO transfers." />}
                    />
                )}

                {props.incomplete.length > 0 && <Incomplete blocks={props.incomplete} />}

                <div role="status" aria-live="polite">
                    {!props.entries && !props.error && (
                        <p>
                            <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />
                            {longLoad && (
                                <FormattedMessage id="wallet.utxoHistory.loading" defaultMessage="Looking for UTXO transfers… (this takes a while when the account has many transactions)" />
                            )}
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
                    <ListUpdating shown={props.pending && !props.pendingMore && !!props.entries} />
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
                                            : <TransferDescription direction={entry.direction} counterparty={entry.counterparty} />}
                                    </div>
                                    {isUnchecked(entry) && (
                                        'mismatch' === entry.problem ? (
                                            <Badge bg="warning" text="dark" className="wallet__history-badge">
                                                <FormattedMessage id="wallet.utxoHistory.mismatch" defaultMessage="The node records it otherwise than the block explorer: trust the node, and copy the hash to check it yourself" />
                                            </Badge>
                                        ) : (
                                            <Badge bg="secondary" className="wallet__history-badge">
                                                <FormattedMessage id="wallet.utxoHistory.unconfirmed" defaultMessage="Not confirmed by the node yet: press Refresh later to look again" />
                                            </Badge>
                                        )
                                    )}
                                    {!isUnchecked(entry) && entry.failed && (
                                        <Badge bg="warning" text="dark" className="wallet__history-badge">
                                            <FormattedMessage id="wallet.utxoHistory.failed" defaultMessage="The transaction failed; no transfer took place" />
                                        </Badge>
                                    )}
                                    {/* Written by the sender, unchecked: labelled as such, and kept from reordering what is around it */}
                                    {!isUnchecked(entry) && entry.comment && (
                                        <div className="wallet__hint small wallet__history-comment">
                                            <FormattedMessage id="wallet.utxoHistory.comment" defaultMessage="Sender's note" />
                                            {': '}
                                            <bdi>{entry.comment}</bdi>
                                        </div>
                                    )}
                                    <EntryMeta
                                        time={isUnchecked(entry) ? undefined : entry.time}
                                        blockID={entry.blockID}
                                        hash={entry.hash}
                                        copied={copied === entry.hash}
                                        onCopy={() => setCopied(entry.hash)}
                                    />
                                </div>
                                {/* Only what the node confirmed has an amount; a failed transfer's moved nothing */}
                                {!isUnchecked(entry) && (
                                    <div className={`wallet__history-amount${entry.failed ? ' wallet__history-amount_void' : ''}`}>
                                        <Amount amount={entry.amount} sign={sign(entry)} token={props.token} />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {props.entries && props.more && (
                    <MoreButton pending={props.pending} pendingMore={props.pendingMore} describedBy="wallet-utxo-checked" onClick={more}>
                        <FormattedMessage id="wallet.utxoHistory.more" defaultMessage="Look further back" />
                    </MoreButton>
                )}
            </Card.Body>
        </Card>
    );
};

export default UtxoHistory;
