/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// What the wallet's history lists share: an amount, and a transaction hash to copy

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import CopyToClipboard from 'react-copy-to-clipboard';
import { formatAmount } from 'lib/tx/amount';

// How long a copied hash shows its check mark
const COPIED_MS = 2000;

// Tokens out
export const MINUS = '\u2212';

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

// One number however narrow the card: it may only break at its decimal point
export const Amount: React.FC<{ amount: string, sign: string, digits: number, symbol: string }> = ({ amount, sign, digits, symbol }) => {
    const [integer, fraction] = formatAmount(amount, digits).split('.');
    const token = <>{' '}<small>{symbol}</small></>;
    return fraction
        ? <><span className="text-nowrap">{sign}{integer}</span><wbr /><span className="text-nowrap">.{fraction}{token}</span></>
        : <span className="text-nowrap">{sign}{integer}{token}</span>;
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

// The hash shortened (all of it in the title), and a button that copies it and says so
export const HashCopy: React.FC<{ hash: string, copied: boolean, onCopy: () => void }> = ({ hash, copied, onCopy }) => {
    const intl = useIntl();
    const label = copied
        ? intl.formatMessage({ id: 'alert.clipboard.copied', defaultMessage: 'Copied to clipboard' })
        : intl.formatMessage({ id: 'wallet.history.copyHash', defaultMessage: 'Copy the transaction hash' });
    return (
        // The short hash and its copy button on one line
        <span className="text-nowrap">
            <span className="font-monospace wallet__history-hash" title={hash}>{`${hash.slice(0, 8)}…${hash.slice(-6)}`}</span>
            <CopyToClipboard text={hash} onCopy={onCopy}>
                <Button
                    variant="link"
                    size="sm"
                    className={`wallet__history-copy align-baseline ${copied ? 'icon-check' : 'icon-docs'}`}
                    aria-label={label}
                    title={label}
                />
            </CopyToClipboard>
        </span>
    );
};

// Says a copy happened to screen readers (inside the list's live region)
export const CopiedStatus: React.FC<{ copied: boolean }> = ({ copied }) => {
    const intl = useIntl();
    return copied
        ? <span className="visually-hidden">{intl.formatMessage({ id: 'alert.clipboard.copied', defaultMessage: 'Copied to clipboard' })}</span>
        : null;
};
