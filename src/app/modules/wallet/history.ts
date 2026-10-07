/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The token movements of an account in one ecosystem, from the node's history table (go-ibax
// 1_history, listed with POST /listWhere/history). What writes a row there, by its type
// (go-ibax smart/gas.pb.go GasScenesType, first_ecosystem NewUser.sim):
//   1 Reward, 2 Taxes, 15 Direct, 16 Combustion: a contract's fee, one row each; status 1 when
//     the transaction failed and the fee was charged anyway (TxInvokeStatusCode_PENALTY)
//   4 NewUser: the account was created (sender the network's white hole account)
//   24 TransferSelf: the account's own move between its account and UTXO balances, one row,
//     sender and recipient both the account, the comment naming the source ("Account" or "UTXO")
//   any other: tokens moved by an application contract, from sender to recipient, the contract
//     saying what for in the comment (the testnet's Basic app: 3 Send coin and element rewards,
//     5 membership, 23 test coins); these contracts are not in go-ibax, so their types are not a
//     closed list
// A UTXO transfer between accounts (transaction type 5, UtxoToken; not history type 5) writes no
// row, for the sender or the recipient: the node keeps it only as UTXO outputs, which no API lists.

import { formatAddress } from 'lib/crypto/address';

export type THistoryFilter = 'transfers' | 'fees' | 'all';

export const DEFAULT_HISTORY_FILTER: THistoryFilter = 'transfers';

export const FEE_TYPES: readonly string[] = ['1', '2', '15', '16'];

export const HISTORY_PAGE_SIZE = 25;

// The columns the page reads, besides id (which comes with every row)
export const HISTORY_COLUMNS = ['sender_id', 'recipient_id', 'amount', 'comment', 'type', 'status', 'block_id', 'txhash', 'created_at'] as const;

// A comment is the contract's own text: shown up to this long
export const COMMENT_LENGTH = 300;

export type THistoryEntry = {
    id: string;
    // When the transaction was signed (ms), as the node records it
    time: number;
    blockID: string;
    // Lower-case hex, or '' for a row without one
    hash: string;
    // In base units of the ecosystem's token
    amount: string;
    // The contract's text, without control and formatting characters, cut to COMMENT_LENGTH
    comment: string;
} & (
    | { kind: 'move', to: 'utxo' | 'account' | null }
    // counterparty null: tokens sent to account 0, which no one holds (burnt)
    | { kind: 'transfer', direction: 'in' | 'out' | 'self', counterparty: string | null }
    // penalty: the transaction failed, the fee was charged all the same
    | { kind: 'fee', direction: 'in' | 'out' | 'self', counterparty: string | null, penalty: boolean }
    | { kind: 'created' }
);

// The account's rows of one ecosystem, newest first, older than `before` (an id) when given: its
// fees, everything else (transfers by any contract, moves between its balances, its creation), or
// all (POST /listWhere where syntax, go-ibax queryBuilder: every value a string, keys joined by
// "and"). Pages by id, not offset: rows written meanwhile go on top and do not move the pages.
export const historyQuery = (keyID: string, ecosystem: string, filter: THistoryFilter, before: string | null = null) => ({
    ecosystem,
    $or: [{ sender_id: keyID }, { recipient_id: keyID }],
    ...('fees' === filter ? { type: { $in: [...FEE_TYPES] } } : 'transfers' === filter ? { type: { $nin: [...FEE_TYPES] } } : {}),
    ...(null === before ? {} : { id: { $lt: before } })
});

const INT64_MIN = -(1n << 63n);
const INT64_MAX = (1n << 63n) - 1n;
const DIGITS = /^\d+$/;
// The latest time a JS Date can hold (ms)
const MAX_TIME = 8.64e15;

// A bigint column as Postgres writes it: canonical, in range
const isInt64 = (value: string) => /^-?\d{1,19}$/.test(value)
    && BigInt(value).toString() === value && BigInt(value) >= INT64_MIN && BigInt(value) <= INT64_MAX;

// Characters that can disguise text: controls, bidi overrides and isolates, zero-width marks
const HIDDEN_CHARACTERS = /[\p{Cc}\p{Cf}]/gu;

// More than two combining marks on a letter only stack up over the lines around it
const STACKED_MARKS = /(\p{M}{2})\p{M}+/gu;

const cleanComment = (comment: string) => {
    const text = comment.replace(HIDDEN_CHARACTERS, ' ').replace(STACKED_MARKS, '$1').replace(/\s+/g, ' ').trim();
    // Cut by characters, not UTF-16 units, so no emoji is cut in half
    const characters = Array.from(text);
    return characters.length > COMMENT_LENGTH ? `${characters.slice(0, COMMENT_LENGTH).join('')}…` : text;
};

// A row id or block number: a positive bigint as Postgres writes it
const isID = (value: string) => isInt64(value) && !value.startsWith('-') && '0' !== value;

// One row as the node returns it (every value a string), or null when it is not a history row of
// this account that this page can show truthfully
export const parseHistoryRow = (row: unknown, keyID: string): THistoryEntry | null => {
    if (!row || 'object' !== typeof row) {
        return null;
    }
    const value = row as Record<string, unknown>;
    const [id, sender, recipient, amount, comment, type, status, blockID, hash, createdAt] = ['id', ...HISTORY_COLUMNS]
        .map(name => 'string' === typeof value[name] ? value[name] as string : null);
    if ([id, sender, recipient, amount, comment, type, status, blockID, hash, createdAt].some(field => null === field)) {
        return null;
    }
    const time = Number(createdAt);
    if (!isID(id) || !isInt64(sender) || !isInt64(recipient) || !/^\d{1,40}$/.test(amount)
        || !DIGITS.test(type) || !DIGITS.test(status) || !isID(blockID) || !/^([0-9a-f]{64})?$/.test(hash)
        || !DIGITS.test(createdAt) || time > MAX_TIME) {
        return null;
    }
    const fromMe = sender === keyID;
    const toMe = recipient === keyID;
    if (!fromMe && !toMe) {
        return null;
    }
    const base = { id, time, blockID, hash, amount, comment: cleanComment(comment) };
    const direction = fromMe && toMe ? 'self' as const : fromMe ? 'out' as const : 'in' as const;

    // Each kind only in the shape the node writes it: a row of another shape is shown as what it
    // does (tokens out or in), never as a harmless move or a creation
    if ('24' === type && 'self' === direction) {
        const source = comment.trim().toLowerCase();
        return { ...base, kind: 'move', to: 'account' === source ? 'utxo' : 'utxo' === source ? 'account' : null };
    }
    if ('4' === type && 'in' === direction) {
        return { ...base, kind: 'created' };
    }
    // Account 0 belongs to no key: tokens sent there are burnt; tokens from it are shown as from it
    const counterparty = 'self' === direction ? null
        : 'out' === direction ? ('0' === recipient ? null : formatAddress(recipient))
            : formatAddress(sender);
    return FEE_TYPES.includes(type)
        ? { ...base, kind: 'fee', direction, counterparty, penalty: '0' !== status }
        : { ...base, kind: 'transfer', direction, counterparty };
};

// A page as the node returns it ({count, list}; no rows as list: null), asked for with one row
// more than shown (that row only tells there are older ones), or null when it is not one this
// page can show truthfully: a page with a row left out would read as complete. The rows must be
// newest first and, for a next page, older than the last row shown. count is the node's own count
// of the matching rows, taken in a separate query (go-ibax getListWhereHandler): rows written in
// between can make it lag behind the list, so it only says how many there are, never whether.
export const parseHistoryPage = (response: unknown, keyID: string, before: string | null) => {
    if (!response || 'object' !== typeof response) {
        return null;
    }
    const { count, list } = response as { count: unknown, list: unknown };
    const rows = Array.isArray(list) ? list : null === list ? [] : null;
    if (!rows || 'number' !== typeof count || !Number.isSafeInteger(count) || count < 0 || rows.length > HISTORY_PAGE_SIZE + 1) {
        return null;
    }
    const entries = rows.map(row => parseHistoryRow(row, keyID));
    if (entries.some(entry => null === entry)) {
        return null;
    }
    // Strictly older row after row, all older than the last row shown
    const ids = [...(null === before ? [] : [before]), ...entries.map(entry => entry.id)].map(id => BigInt(id));
    if (ids.some((id, index) => index > 0 && id >= ids[index - 1])) {
        return null;
    }
    const older = entries.length > HISTORY_PAGE_SIZE;
    const shown = older ? entries.slice(0, HISTORY_PAGE_SIZE) : entries;
    return { entries: shown, more: older ? Math.max(count - shown.length, 1) : 0 };
};
