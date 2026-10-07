/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { formatAddress } from 'lib/crypto/address';
import { HISTORY_PAGE_SIZE, historyQuery, parseHistoryPage, parseHistoryRow } from './history';

// Rows as the IBAX testnet returned them (POST /listWhere/history, block 3189-3191)
const ME = '2076825197413217876';
const OTHER = '-8741730234915739617';
const HASH = '952030ceedbf23aaa35bf9925b4a5cf1190d3f35d2eecad9be1967dcc6bc8220';
const row = (values: Record<string, string>) => ({
    id: '54296', sender_id: ME, recipient_id: OTHER, amount: '100000000000000', comment: '', type: '3', status: '0',
    block_id: '3189', txhash: HASH, created_at: '1791297083256',
    ...values
});

describe('wallet history', () => {
    it('asks for the account\'s rows of one ecosystem, sent or received, of the kinds shown, older than a row', () => {
        // The query is the contract with the node: written out, not built from the module's constants
        expect(historyQuery(ME, '2', 'transfers')).toEqual({
            ecosystem: '2',
            $or: [{ sender_id: ME }, { recipient_id: ME }],
            // Everything but fees: transfers by any contract, whatever type it records them as
            type: { $nin: ['1', '2', '15', '16'] }
        });
        expect(historyQuery(ME, '1', 'fees')).toMatchObject({ type: { $in: ['1', '2', '15', '16'] } });
        expect(historyQuery(ME, '1', 'all')).not.toHaveProperty('type');
        // The next page: by id, so rows written meanwhile do not move it
        expect(historyQuery(ME, '1', 'all', '54296')).toMatchObject({ id: { $lt: '54296' } });
        expect(historyQuery(ME, '1', 'all', null)).not.toHaveProperty('id');
    });

    it('reads a transfer sent and one received, with the other account\'s address', () => {
        expect(parseHistoryRow(row({}), ME)).toEqual({
            id: '54296', time: 1791297083256, blockID: '3189', hash: HASH,
            amount: '100000000000000', comment: '', kind: 'transfer', direction: 'out', counterparty: formatAddress(OTHER)
        });
        // A negative id is an address above 2^63 (go-ibax stores the uint64 as int64):
        // 2^64 - 8741730234915739617 = 9705013838793811999
        expect(formatAddress(OTHER)).toBe('0970-5013-8387-9381-1999');
        expect(parseHistoryRow(row({ sender_id: OTHER, recipient_id: ME }), ME)).toMatchObject({ kind: 'transfer', direction: 'in', counterparty: '0970-5013-8387-9381-1999' });
    });

    it('tells the direction of a move between balances from its source, whatever its case', () => {
        const move = (comment: string) => parseHistoryRow(row({ type: '24', recipient_id: ME, comment }), ME);
        expect(move('Account')).toMatchObject({ kind: 'move', to: 'utxo' });
        expect(move('utxo')).toMatchObject({ kind: 'move', to: 'account' });
        expect(move('something else')).toMatchObject({ kind: 'move', to: null });
    });

    it('shows a row of a kind in another shape than the node writes as the tokens it moves', () => {
        // A "move" to someone else, a "creation" sending tokens out: what they do, not what they claim
        expect(parseHistoryRow(row({ type: '24', comment: 'Account' }), ME)).toMatchObject({ kind: 'transfer', direction: 'out', counterparty: formatAddress(OTHER) });
        expect(parseHistoryRow(row({ type: '4' }), ME)).toMatchObject({ kind: 'transfer', direction: 'out' });
        expect(parseHistoryRow(row({ type: '4', sender_id: '5555', recipient_id: ME, amount: '0' }), ME)).toMatchObject({ kind: 'created' });
    });

    it('reads fees paid, received and charged for a failed transaction, burnt tokens and any other contract\'s transfer', () => {
        expect(parseHistoryRow(row({ type: '1', recipient_id: '7107522600053588199' }), ME)).toMatchObject({ kind: 'fee', direction: 'out', counterparty: formatAddress('7107522600053588199'), penalty: false });
        expect(parseHistoryRow(row({ type: '2', sender_id: OTHER, recipient_id: ME }), ME)).toMatchObject({ kind: 'fee', direction: 'in', counterparty: formatAddress(OTHER) });
        expect(parseHistoryRow(row({ type: '2', recipient_id: ME }), ME)).toMatchObject({ kind: 'fee', direction: 'self', counterparty: null });
        expect(parseHistoryRow(row({ type: '2', status: '1' }), ME)).toMatchObject({ kind: 'fee', penalty: true });
        // Sent to account 0: burnt; received from it: shown as from it, not as "burnt"
        expect(parseHistoryRow(row({ type: '16', recipient_id: '0' }), ME)).toMatchObject({ kind: 'fee', direction: 'out', counterparty: null });
        expect(parseHistoryRow(row({ sender_id: '0', recipient_id: ME }), ME)).toMatchObject({ direction: 'in', counterparty: '0000-0000-0000-0000-0000' });
        // The testnet's test coins (type 23) and membership (type 5), with what the contract says
        expect(parseHistoryRow(row({ type: '23', sender_id: '5555', recipient_id: ME, comment: 'Get test coins' }), ME))
            .toMatchObject({ kind: 'transfer', direction: 'in', counterparty: formatAddress('5555'), comment: 'Get test coins' });
        expect(parseHistoryRow(row({ type: '99' }), ME)).toMatchObject({ kind: 'transfer', direction: 'out' });
    });

    it('keeps a contract\'s comment from disguising itself', () => {
        // Bidi overrides and zero-width characters would reorder or hide text; a comment has a length
        expect(parseHistoryRow(row({ comment: 'pay‮for​\u0000 rent\n\nnow' }), ME)).toMatchObject({ comment: 'pay for rent now' });
        expect((parseHistoryRow(row({ comment: 'x'.repeat(5000) }), ME) as { comment: string }).comment).toBe(`${'x'.repeat(300)}…`);
        // Combining marks stacked over the lines around (at most two kept), an emoji never cut in half
        expect(parseHistoryRow(row({ comment: `a${'\u0300'.repeat(40)}b` }), ME)).toMatchObject({ comment: 'a\u0300\u0300b' });
        expect((parseHistoryRow(row({ comment: `${'x'.repeat(299)}😀😀` }), ME) as { comment: string }).comment).toBe(`${'x'.repeat(299)}😀…`);
    });

    it('refuses a row it cannot show truthfully', () => {
        for (const broken of [
            { amount: '1.5' }, { amount: '-1' }, { amount: 'NULL' }, { sender_id: 'x' }, { txhash: '0xAB' }, { txhash: 'ab12' },
            { created_at: '' }, { type: 'transfer' }, { id: '' }, { status: '' },
            // Row ids and blocks as Postgres writes them: positive, canonical, in range
            { id: '0' }, { id: '007' }, { id: '-3' }, { block_id: '0' }, { block_id: '9'.repeat(40) },
            // A date no clock can show (it would throw while rendering)
            { created_at: '99999999999999999' },
            // Not a bigint column as the node writes it
            { recipient_id: '-0' }, { recipient_id: '007' }, { recipient_id: '-9999999999999999999' },
            // Not the account's row at all
            { sender_id: OTHER, recipient_id: '5' }
        ]) {
            expect([broken, parseHistoryRow(row(broken), ME)]).toEqual([broken, null]);
        }
        expect(parseHistoryRow(null, ME)).toBeNull();
        expect(parseHistoryRow({ ...row({}), amount: 5 }, ME)).toBeNull();
        // A row without a hash is still a row
        expect(parseHistoryRow(row({ txhash: '' }), ME)).toMatchObject({ hash: '' });
    });

    it('reads a page, telling from one row more than it shows whether older rows remain', () => {
        const rows = (ids: number[]) => ids.map(id => row({ id: String(id) }));
        const ids = (page: ReturnType<typeof parseHistoryPage>) => page.entries.map(entry => entry.id);
        // 26 rows asked for, 26 came: 25 shown, and the node counts 40 in all
        const full = parseHistoryPage({ count: 40, list: rows(Array.from({ length: HISTORY_PAGE_SIZE + 1 }, (_, i) => 100 - i)) }, ME, null);
        expect(ids(full)).toHaveLength(HISTORY_PAGE_SIZE);
        expect(full.more).toBe(15);
        // The last page; and no rows at all, which the node sends as list: null
        expect(parseHistoryPage({ count: 2, list: rows([5, 4]) }, ME, '6')).toEqual({ entries: rows([5, 4]).map(r => parseHistoryRow(r, ME)), more: 0 });
        expect(parseHistoryPage({ count: 0, list: null }, ME, null)).toEqual({ entries: [], more: 0 });
        // The node counts and lists in two queries: rows written in between make the count lag
        // behind, which neither refuses the page nor hides that older rows remain
        expect(parseHistoryPage({ count: 2, list: rows([9, 8, 7]) }, ME, null)).toMatchObject({ more: 0 });
        expect(parseHistoryPage({ count: 25, list: rows(Array.from({ length: 26 }, (_, i) => 100 - i)) }, ME, null)).toMatchObject({ more: 1 });
        expect(parseHistoryPage({ count: 3, list: null }, ME, null)).toEqual({ entries: [], more: 0 });
    });

    it('refuses a page it cannot show whole, or whose rows are not older and older', () => {
        for (const [broken, before] of [
            [{ count: 2, list: [row({ id: '2' }), row({ id: '1', amount: '1.5' })] }, null],
            [{ count: 'x', list: [] }, null], [{ list: [] }, null], [{ count: -1, list: [] }, null], [{ count: 1e300, list: [] }, null],
            // More rows than asked for, one row twice, out of order, not older than the rows shown
            [{ count: 100, list: Array.from({ length: HISTORY_PAGE_SIZE + 2 }, (_, i) => row({ id: String(100 - i) })) }, null],
            [{ count: 2, list: [row({ id: '5' }), row({ id: '5' })] }, null],
            [{ count: 2, list: [row({ id: '4' }), row({ id: '5' })] }, null],
            [{ count: 1, list: [row({ id: '7' })] }, '7'],
            [null, null]
        ] as [unknown, string | null][]) {
            expect([broken, parseHistoryPage(broken, ME, before)]).toEqual([broken, null]);
        }
    });
});
