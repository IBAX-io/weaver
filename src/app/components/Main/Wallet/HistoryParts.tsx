/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// What the wallet's history lists share: an amount, a transaction hash to copy, the line under a
// row, an error to try again, and where the focus goes when rows come and go

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import CopyToClipboard from 'react-copy-to-clipboard';
import { formatAmount } from 'lib/tx/amount';
import { TDirection } from 'modules/wallet/direction';

// How long a copied hash shows its check mark
const COPIED_MS = 2000;

// Tokens out
export const MINUS = '\u2212';

// Tokens out are "−", in "+"; to oneself, neither
export const directionSign = (direction: TDirection) => 'out' === direction ? MINUS : 'in' === direction ? '+' : '';

// "Show older" for a list newest first: ignored while a page loads (the button stays focusable: a
// disabled one drops the focus), and the first new row takes the focus once it is in. When none
// came, the focus stays on the button, or goes to `fallback` if the button went away.
export const useMoreFocus = (shown: number, pending: boolean, onMore: () => void, fallback: React.RefObject<HTMLElement>) => {
    const list = useRef<HTMLUListElement>(null);
    const after = useRef<number | null>(null);
    useEffect(() => {
        if (null === after.current || pending) {
            return;
        }
        const next = list.current && list.current.children[after.current] as HTMLElement | undefined;
        after.current = null;
        if (next) {
            next.focus();
        }
        else if (document.activeElement === document.body && fallback.current) {
            fallback.current.focus();
        }
    }, [shown, pending, fallback]);
    const more = () => {
        if (!pending) {
            after.current = shown;
            onMore();
        }
    };
    return { list, more };
};

// The ecosystem's token as the balance gives it; null while the balance is not known (amounts in
// base units cannot be shown without its digits)
export interface IToken {
    digits: number;
    symbol: string;
}

// One number however narrow the card: it may only break at its decimal point
export const Amount: React.FC<{ amount: string, sign: string, token: IToken | null }> = ({ amount, sign, token }) => {
    const intl = useIntl();
    if (!token) {
        const unknown = intl.formatMessage({ id: 'wallet.history.amountUnknown', defaultMessage: 'Amount not shown: the balance could not be loaded' });
        return <span title={unknown}><span aria-hidden="true">—</span><span className="visually-hidden">{unknown}</span></span>;
    }
    const { digits, symbol } = token;
    const [integer, fraction] = formatAmount(amount, digits).split('.');
    const unit = <>{' '}<small>{symbol}</small></>;
    return fraction
        ? <><span className="text-nowrap">{sign}{integer}</span><wbr /><span className="text-nowrap">.{fraction}{unit}</span></>
        : <span className="text-nowrap">{sign}{integer}{unit}</span>;
};

// Which row's hash was just copied, for a moment
export const useCopied = () => {
    const [copied, setCopied] = useState<string | null>(null);
    useEffect(() => {
        if (null === copied) {
            return undefined;
        }
        const timer = setTimeout(() => setCopied(null), COPIED_MS);
        return () => clearTimeout(timer);
    }, [copied]);
    return [copied, setCopied] as const;
};

// A button that copies a transaction hash and says so
export const CopyHashButton: React.FC<{ hash: string, copied: boolean, onCopy: () => void }> = ({ hash, copied, onCopy }) => {
    const intl = useIntl();
    const label = copied
        ? intl.formatMessage({ id: 'alert.clipboard.copied', defaultMessage: 'Copied to clipboard' })
        : intl.formatMessage({ id: 'wallet.history.copyHash', defaultMessage: 'Copy the transaction hash' });
    return (
        <CopyToClipboard text={hash} onCopy={onCopy}>
            <Button
                variant="link"
                size="sm"
                className={`wallet__history-copy align-baseline ${copied ? 'icon-check' : 'icon-docs'}`}
                aria-label={label}
                title={label}
            />
        </CopyToClipboard>
    );
};

// The hash shortened (all of it in the title), and its copy button, on one line
const HashCopy: React.FC<{ hash: string, copied: boolean, onCopy: () => void }> = props => (
    <span className="text-nowrap">
        <span className="font-monospace wallet__history-hash" title={props.hash}>{`${props.hash.slice(0, 8)}…${props.hash.slice(-6)}`}</span>
        <CopyHashButton {...props} />
    </span>
);

// Says a copy happened to screen readers (inside the list's live region)
export const CopiedStatus: React.FC<{ copied: boolean }> = ({ copied }) => {
    const intl = useIntl();
    return copied
        ? <span className="visually-hidden">{intl.formatMessage({ id: 'alert.clipboard.copied', defaultMessage: 'Copied to clipboard' })}</span>
        : null;
};

// "Try again" takes the focus to the card's heading: the alert holding it goes away
export const useRetry = (title: React.RefObject<HTMLElement>, onRetry: () => void) => () => {
    if (title.current) {
        title.current.focus();
    }
    onRetry();
};

// An error loading a list, and "Try again". An alert announces itself: it is kept outside the
// polite region, so it is not read twice. A warning while rows are shown, an error otherwise.
export const ListError: React.FC<{ message: React.ReactNode, shown: boolean, onRetry: () => void }> = ({ message, shown, onRetry }) => (
    <Alert variant={shown ? 'warning' : 'danger'}>
        {message}
        {' '}
        <Button variant="link" size="sm" className="p-0 align-baseline" onClick={onRetry}>
            <FormattedMessage id="wallet.history.retry" defaultMessage="Try again" />
        </Button>
    </Alert>
);

// Beside a list's heading while its rows are loaded again (said by ListUpdating, not by this)
export const HeadingSpinner: React.FC<{ shown: boolean }> = ({ shown }) => shown
    ? <Spinner as="span" animation="border" size="sm" className="ms-2" aria-hidden="true" />
    : null;

// Inside the list's polite region: said while it is loaded again from the newest, as the spinner
// beside the heading is not
export const ListUpdating: React.FC<{ shown: boolean }> = ({ shown }) => shown
    ? <span className="visually-hidden"><FormattedMessage id="wallet.history.updating" defaultMessage="Updating…" /></span>
    : null;

// Loads older rows; busy while they load (kept focusable: useMoreFocus ignores a press meanwhile)
export const MoreButton: React.FC<{ pending: boolean, pendingMore: boolean, describedBy?: string, onClick: () => void, children: React.ReactNode }> = props => (
    <Button
        variant="link"
        size="sm"
        className="mt-2 px-0"
        aria-disabled={props.pending}
        aria-busy={props.pending && props.pendingMore}
        aria-describedby={props.describedBy}
        onClick={props.onClick}
    >
        {props.pending && props.pendingMore && <Spinner as="span" animation="border" size="sm" className="me-2" aria-hidden="true" />}
        {props.children}
    </Button>
);

// The line under a row: when (if known), the block, and the hash to copy (if any)
export const EntryMeta: React.FC<{ time?: number, blockID: string, hash?: string, copied: boolean, onCopy: () => void }> = props => {
    const intl = useIntl();
    return (
        <div className="wallet__hint small">
            {undefined !== props.time && (
                <>
                    <time dateTime={new Date(props.time).toISOString()}>
                        {intl.formatDate(props.time, { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                    {' · '}
                </>
            )}
            <FormattedMessage id="wallet.history.block" defaultMessage="Block {block}" values={{ block: props.blockID }} />
            {props.hash && (
                <>
                    {' · '}
                    <HashCopy hash={props.hash} copied={props.copied} onCopy={props.onCopy} />
                </>
            )}
        </div>
    );
};

// A transfer, in a line: to oneself, to an account, or from one
export const TransferDescription: React.FC<{ direction: TDirection, counterparty: string | null }> = ({ direction, counterparty }) => {
    const address = <span className="font-monospace">{counterparty}</span>;
    return 'self' === direction
        ? <FormattedMessage id="wallet.history.transfer.self" defaultMessage="Sent to yourself" />
        : 'out' === direction
            ? <FormattedMessage id="wallet.history.transfer.out" defaultMessage="Sent to {address}" values={{ address }} />
            : <FormattedMessage id="wallet.history.transfer.in" defaultMessage="Received from {address}" values={{ address }} />;
};

// A list loaded again from its newest row replaces its rows: one holding the focus may go, and the
// focus with it (to the page's body). It goes to `fallback` instead.
export const useFocusKept = (list: React.RefObject<HTMLElement>, rows: unknown, fallback: React.RefObject<HTMLElement>) => {
    const inList = useRef(false);
    useEffect(() => {
        const element = list.current;
        if (!element) {
            return undefined;
        }
        const enter = () => { inList.current = true; };
        // Leaving for another element of the page, not because the row went away
        const leave = (event: FocusEvent) => { inList.current = !!event.relatedTarget && element.contains(event.relatedTarget as Node); };
        element.addEventListener('focusin', enter);
        element.addEventListener('focusout', leave);
        return () => {
            element.removeEventListener('focusin', enter);
            element.removeEventListener('focusout', leave);
        };
    // The list element comes and goes only with its rows
    }, [list, rows]);
    useEffect(() => {
        if (inList.current && (document.activeElement === document.body || !document.activeElement) && fallback.current) {
            inList.current = false;
            fallback.current.focus();
        }
    }, [rows, fallback]);
};

// Whether something has been going on for a while: a second list loading at the same time as
// another is said once that one had its turn (two polite regions speaking at once are noise)
export const useAfterAWhile = (on: boolean, ms = 1000) => {
    const [after, setAfter] = useState(false);
    useEffect(() => {
        if (!on) {
            setAfter(false);
            return undefined;
        }
        const timer = setTimeout(() => setAfter(true), ms);
        return () => clearTimeout(timer);
    }, [on, ms]);
    return after;
};
