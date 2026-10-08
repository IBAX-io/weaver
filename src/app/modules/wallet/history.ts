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
import { cleanComment, DIGITS, isID, isInt64, MAX_TIME } from './validate';
import { TDirection, transferDirection } from './direction';

export type THistoryFilter = 'transfers' | 'fees' | 'all';

export const DEFAULT_HISTORY_FILTER: THistoryFilter = 'transfers';

export const FEE_TYPES: readonly string[] = ['1', '2', '15', '16'];

export const HISTORY_PAGE_SIZE = 25;

// The columns the page reads, besides id (which comes with every row)
export const HISTORY_COLUMNS = ['sender_id', 'recipient_id', 'amount', 'comment', 'type', 'status', 'block_id', 'txhash', 'created_at'] as const;

export type THistoryEntry = {
    id: string;
    // When the transaction was signed (ms), as the node records it
    time: number;
    blockID: string;
    // Lower-case hex, or '' for a row without one
    hash: string;
    // In base units of the ecosystem's token
    amount: string;
    // The contract's text, without control and formatting characters, cut short (validate.ts)
    comment: string;
} & (
    | { kind: 'move', to: 'utxo' | 'account' | null }
    // counterparty null: tokens sent to account 0, which no one holds (burnt)
    | { kind: 'transfer', direction: TDirection, counterparty: string | null }
    // penalty: the transaction failed, the fee was charged all the same
    | { kind: 'fee', direction: TDirection, counterparty: string | null, penalty: boolean }
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
    const direction = transferDirection(sender, recipient, keyID);
    if (!direction) {
        return null;
    }
    const base = { id, time, blockID, hash, amount, comment: cleanComment(comment) };

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
