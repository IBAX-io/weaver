/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// What the node records of a UTXO transfer the block explorer lists (modules/wallet/utxoHistory):
// GET /txinfo/{hash}?contractinfo=true, taken only where it matches the explorer's row.

import { formatAddress, parseAddress } from 'lib/crypto/address';
import { IExplorerRow } from './utxoHistory';
import { cleanComment, DIGITS, isInt64, MAX_TIME } from './validate';
import { TDirection, transferDirection } from './direction';

// Digits of the largest amount taken: 2^256 - 1 has 78
const MAX_AMOUNT_DIGITS = 78;

export interface IUtxoTransfer {
    hash: string;
    blockID: string;
    // When the transaction was signed (ms), as the node records it
    time: number;
    direction: TDirection;
    counterparty: string | null;
    // In base units of the ecosystem's token
    amount: string;
    comment: string;
    // The node recorded the transaction as failed: nothing moved
    failed: boolean;
}

// A transfer the explorer lists that the node does not confirm, shown with its hash and nothing the
// node did not confirm: 'unconfirmed', the node does not know it (yet: it lags behind the explorer,
// or the block was rolled back); 'mismatch', the node records it otherwise than the explorer lists
// it (another block or ecosystem, or no UTXO transfer)
export interface IUncheckedTransfer {
    hash: string;
    blockID: string;
    problem: 'unconfirmed' | 'mismatch';
}

export type TUtxoHistoryEntry = IUtxoTransfer | IUncheckedTransfer;

// What the node recorded under the explorer's row: the UTXO transfer from the account's side;
// 'other' when it is a UTXO transfer between two other accounts (the explorer lists every
// transaction the account has a part in, such as one whose fee it earned as a node); 'unknown' when
// the node has no such transaction ({"blockid":"","confirm":0}); or 'mismatch' when the node's
// record does not match the row: another transaction, block or ecosystem, or not a UTXO transfer
export const verifyUtxoTransfer = (row: IExplorerRow, node: { json: unknown, text: string }, keyID: string): IUtxoTransfer | 'other' | 'unknown' | 'mismatch' => {
    const answer = node.json as { blockid?: unknown, data?: Record<string, unknown> };
    if (answer && 'object' === typeof answer && '' === answer.blockid && undefined === answer.data) {
        return 'unknown';
    }
    const data = answer?.data;
    if (!data || 'object' !== typeof data || data.hash !== row.hash || data.block_id !== row.block
        || String(data.ecosystem) !== row.ecosystem || 'string' !== typeof data.address) {
        return 'mismatch';
    }
    const utxo = (data.params as { utxo?: Record<string, unknown> })?.utxo;
    // ToID is an int64 written as a bare number: read from the text, where it is exact. The response
    // has one transaction, so one ToID key (in a comment, the quotes would be escaped). The rounded
    // value JSON.parse gives must agree, so it is this transaction's ToID.
    const toIDs = [...node.text.matchAll(/"ToID"\s*:\s*(-?\d+)(?=\s*[,}])/g)].map(match => match[1]);
    const sender = parseAddress(data.address);
    // The amount in base units, a whole number written as text: up to 78 digits (2^256), leading
    // zeros dropped. Nothing (all zeros: '') is no transfer, which the node does not record either
    // (go-ibax refuses a UTXO Value that is not positive): a mismatch.
    const value = utxo && 'object' === typeof utxo ? utxo.Value : undefined;
    const amount = 'string' === typeof value && DIGITS.test(value) ? value.replace(/^0+/, '') : null;
    if (!utxo || 'object' !== typeof utxo || 1 !== toIDs.length || !isInt64(toIDs[0]) || Number(toIDs[0]) !== utxo.ToID
        || null === sender || !amount || amount.length > MAX_AMOUNT_DIGITS
        || ('string' !== typeof utxo.Comment && undefined !== utxo.Comment)
        || !Number.isSafeInteger(data.created_at) || (data.created_at as number) < 0 || (data.created_at as number) > MAX_TIME
        || (0 !== data.status && 1 !== data.status)) {
        return 'mismatch';
    }
    const recipient = toIDs[0];
    const direction = transferDirection(sender, recipient, keyID);
    if (!direction) {
        return 'other';
    }
    return {
        hash: row.hash,
        blockID: String(row.block),
        time: data.created_at as number,
        direction,
        counterparty: 'self' === direction ? null : formatAddress('out' === direction ? recipient : sender),
        amount,
        comment: cleanComment((utxo.Comment as string) || ''),
        failed: 1 === data.status
    };
};
