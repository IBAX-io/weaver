/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { parseAddress } from 'lib/crypto/address';
import {
    EXPLORER_PAGE_SIZE, EXPLORER_REQUESTS, findTransfers, UTXO_LOOKUPS, IExplorerCursor, IExplorerRow, parseExplorerPage, TExplorerPage, UTXO_PAGE_SIZE, verifyUtxoTransfer
} from './utxoHistory';

// What the IBAX testnet's node answered for these transfers
const REWARD_HASH = '7bc57a0270b111a3e74f9824ffb98a6cb37809dbc74ad56ab4a1fb445143004c';
const REWARD_TEXT = '{"blockid":"2545","confirm":0,"data":{"block_id":2545,"block_hash":"d6984a092523fde32e3c2fac7aa7b19124d6b9f52d96abf1274c5c3da1b6153d","address":"1634-8099-0439-6342-1518","ecosystem":1,"hash":"7bc57a0270b111a3e74f9824ffb98a6cb37809dbc74ad56ab4a1fb445143004c","expedite":"0","contract_name":"","params":{"utxo":{"ToID":-6561781177931602744,"Value":"100000000000000","Comment":"Rewards of 9th, May. TG winner"}},"created_at":1684717208771,"size":"239.00B","status":0}}';
const SENT_HASH = '8467691d52d2f9c77af0b81234cf55cdca90b76b6081fd462498ccd31e616b52';
const SENT_TEXT = '{"blockid":"1606","confirm":0,"data":{"block_id":1606,"block_hash":"2ca56844355ed3d49463fc2bc4d2baae7edfcb15b5b171481cd9397f7a75769e","address":"0207-6825-1974-1321-7876","ecosystem":1,"hash":"8467691d52d2f9c77af0b81234cf55cdca90b76b6081fd462498ccd31e616b52","expedite":"","contract_name":"","params":{"utxo":{"ToID":-868164129336259442,"Value":"1","Comment":""}},"created_at":1665564405293,"size":"164.00B","status":0}}';
// What it answers for a transaction it does not have
const UNKNOWN_TEXT = '{"blockid":"","confirm":0}';
const RECIPIENT = '1188-4962-8957-7794-8872';
const SENDER = '0207-6825-1974-1321-7876';

const node = (text: string) => ({ json: JSON.parse(text), text });
const rewardRow: IExplorerRow = { hash: REWARD_HASH, block: 2545, contract: 'UTXO_Tx', ecosystem: '1' };
const sentRow: IExplorerRow = { hash: SENT_HASH, block: 1606, contract: 'UTXO_Tx', ecosystem: '1' };

// The account's transactions as the testnet's explorer holds them: newest block first, and inside a
// block an order that differs from one request to the next (it depends on the page and its size)
const explorerOf = (initial: IExplorerRow[]) => {
    let rows = initial;
    let calls = 0;
    // FNV-1a seeded by the request: a different order of each block's rows for each request
    const score = (hash: string, page: number, limit: number) => {
        let value = (2166136261 ^ (page * 1000003 + limit)) >>> 0;
        for (const char of hash) {
            value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
        }
        return value;
    };
    const read: TExplorerPage = async (page, limit) => {
        calls++;
        const sorted = [...rows].sort((a, b) => b.block - a.block || score(a.hash, page, limit) - score(b.hash, page, limit));
        return { total: rows.length, rows: sorted.slice((page - 1) * limit, page * limit) };
    };
    return { read, calls: () => calls, replace: (next: IExplorerRow[]) => { rows = next; } };
};

// Blocks of the given sizes, newest first, every third transaction a UTXO transfer
let serial = 0;
const blocks = (sizes: [block: number, count: number][]) => sizes.flatMap(([block, count]) => Array.from({ length: count }, () => {
    serial++;
    return { hash: serial.toString(16).padStart(64, '0'), block, contract: 0 === serial % 3 ? 'UTXO_Tx' : '@1TokensSend', ecosystem: '1' };
}));
const transfers = (rows: IExplorerRow[]) => rows.filter(row => 'UTXO_Tx' === row.contract).map(row => row.hash).sort();

// Every page from the cursor on, as the wallet asks for them
const walk = async (read: TExplorerPage, between: () => void = () => undefined) => {
    const found: string[] = [];
    const incomplete: string[] = [];
    let checked = 0;
    let cursor: IExplorerCursor | null = null;
    for (let page = 0; page < 200; page++) {
        const result = await findTransfers(read, cursor);
        found.push(...result.found.map(row => row.hash));
        incomplete.push(...result.incomplete.map(block => block.blockID));
        checked += result.checked;
        if (!result.next) {
            return { found, incomplete, checked };
        }
        cursor = result.next;
        between();
    }
    throw new Error('never ends');
};

describe('finding UTXO transfers in the block explorer', () => {
    // Blocks running over page boundaries: 100 rows a page
    const LAYOUT: [number, number][] = [[900, 37], [899, 150], [898, 3], [897, 260], [896, 1], [895, 99], [894, 120], [893, 4]];

    it('the explorer this simulates loses rows when paged by number alone (positive control)', async () => {
        const rows = blocks(LAYOUT);
        const { read } = explorerOf(rows);
        const seen = new Set<string>();
        for (let page = 1; (page - 1) * EXPLORER_PAGE_SIZE < rows.length; page++) {
            (await read(page, EXPLORER_PAGE_SIZE)).rows.forEach(row => seen.add(row.hash));
        }
        expect(seen.size).toBeLessThan(rows.length);
    });

    it('finds every transfer once, page after page, where blocks run over pages', async () => {
        const rows = blocks(LAYOUT);
        const result = await walk(explorerOf(rows).read);
        // Each of the account's transactions gone through once
        expect(result.checked).toBe(rows.length);
        expect([...result.found].sort()).toEqual(transfers(rows));
        expect(new Set(result.found).size).toBe(result.found.length);
        expect(result.incomplete).toEqual([]);
    });

    it('gives the transfers newest first, whole blocks of them, spending at most so many requests', async () => {
        const rows = blocks(LAYOUT);
        const explorer = explorerOf(rows);
        const first = await findTransfers(explorer.read, null);
        // At least a page of them, up to the end of the block the page filled up in, or as many as
        // are looked up at a time: block 899 has 50 transfers, on top of block 900's 12
        expect(first.found.length).toBeGreaterThanOrEqual(UTXO_PAGE_SIZE);
        expect(first.found.length).toBeLessThanOrEqual(UTXO_LOOKUPS);
        const lastBlock = first.found[first.found.length - 1].block;
        const inLast = transfers(rows.filter(row => row.block === lastBlock));
        const foundInLast = first.found.filter(row => row.block === lastBlock).map(row => row.hash);
        expect(foundInLast.length).toBeLessThan(inLast.length);
        // Cut short in the order of the hashes: on with the rest of the block next
        expect(foundInLast).toEqual(inLast.slice(0, foundInLast.length));
        expect(first.next).toEqual({ block: lastBlock, position: 37, skip: 0, after: foundInLast[foundInLast.length - 1] });
        expect(first.found.map(row => row.block)).toEqual([...first.found.map(row => row.block)].sort((a, b) => b - a));
        // The page reads; plus, for each block read over two of them, one read of all of it
        expect(explorer.calls()).toBeLessThanOrEqual(2 * EXPLORER_REQUESTS);
        expect(first.total).toBe(rows.length);
    });

    it('neither repeats nor skips a transfer when transactions arrive on top between pages', async () => {
        const rows = blocks(LAYOUT);
        const explorer = explorerOf(rows);
        let current = rows;
        const result = await walk(explorer.read, () => {
            current = [...blocks([[1000 + current.length, 7]]), ...current];
            explorer.replace(current);
        });
        // Every transfer of the transactions there at the start, once
        const original = transfers(rows);
        expect(result.found.filter(hash => original.includes(hash)).sort()).toEqual(original);
        expect(new Set(result.found).size).toBe(result.found.length);
    });

    it('finds where it stopped when transactions above were removed (a block rolled back)', async () => {
        const rows = blocks(LAYOUT);
        const explorer = explorerOf(rows);
        const first = await findTransfers(explorer.read, null);
        // The two newest blocks go away: the rest moves up by 187 rows
        const rest = rows.filter(row => row.block < 899);
        explorer.replace(rest);
        const found: string[] = [...first.found.map(row => row.hash)];
        let cursor = first.next;
        // Bounded: a cursor that does not move on must fail the test, not hang it
        for (let pages = 0; cursor; pages++) {
            expect(pages).toBeLessThan(100);
            const page = await findTransfers(explorer.read, cursor);
            found.push(...page.found.map(row => row.hash));
            cursor = page.next;
        }
        expect(found.filter(hash => rest.some(row => row.hash === hash)).sort()).toEqual(transfers(rest));
        expect(new Set(found).size).toBe(found.length);
    });

    it('finds where it stopped when many pages of transactions arrive on top, or go away above it', async () => {
        for (const change of ['added', 'removed'] as const) {
            const rows = blocks(LAYOUT);
            const newer = blocks(Array.from({ length: 26 }, (_, i): [number, number] => [5000 - i, 50]));
            const explorer = explorerOf('removed' === change ? [...newer, ...rows] : rows);
            const first = await findTransfers(explorer.read, null);
            // 1,300 rows (13 pages) more or fewer above where it stopped
            explorer.replace('removed' === change ? rows : [...newer, ...rows]);
            const found = new Set(first.found.map(row => row.hash));
            let cursor = first.next;
            for (let pages = 0; cursor; pages++) {
                expect(pages).toBeLessThan(100);
                const page = await findTransfers(explorer.read, cursor);
                for (const row of page.found) {
                    expect([change, found.has(row.hash)]).toEqual([change, false]);
                    found.add(row.hash);
                }
                cursor = page.next;
            }
            // Every transfer still listed from where it stopped
            const older = transfers(rows.filter(row => row.block <= first.next.block));
            expect(older.length).toBeGreaterThan(0);
            expect([change, older.filter(hash => !found.has(hash))]).toEqual([change, []]);
        }
    });

    it('goes on from the same place when transactions keep arriving on top while it reads', async () => {
        const rows = blocks(LAYOUT);
        const explorer = explorerOf(rows);
        const first = await findTransfers(explorer.read, null);
        let current = rows;
        let block = 10000;
        // 100 more on top before every request
        const moving: TExplorerPage = (page, limit) => {
            current = [...blocks([[block++, 100]]), ...current];
            explorer.replace(current);
            return explorer.read(page, limit);
        };
        const page = await findTransfers(moving, first.next);
        expect(page.next).not.toBeNull();
        expect(page.next.block).toBeLessThanOrEqual(first.next.block);
        // Once it stops, the rest is found
        const found = new Set([...first.found, ...page.found].map(row => row.hash));
        let cursor = page.next;
        for (let pages = 0; cursor; pages++) {
            expect(pages).toBeLessThan(100);
            const next = await findTransfers(explorer.read, cursor);
            next.found.forEach(row => found.add(row.hash));
            cursor = next.next;
        }
        expect(transfers(rows).filter(hash => !found.has(hash))).toEqual([]);
    });

    it('finds where it stopped in a few requests, however far the list moved', async () => {
        const rows = blocks(LAYOUT);
        const explorer = explorerOf(rows);
        const first = await findTransfers(explorer.read, null);
        // 130 pages more on top: going one page at a time would take 130 requests
        explorer.replace([...blocks(Array.from({ length: 260 }, (_, i): [number, number] => [90000 - i, 50])), ...rows]);
        const before = explorer.calls();
        const page = await findTransfers(explorer.read, first.next);
        expect(page.found[0].block).toBeLessThanOrEqual(first.next.block);
        // Halving: about twice the log of the pages moved, then the pages it reads
        expect(explorer.calls() - before).toBeLessThanOrEqual(20 + 2 * EXPLORER_REQUESTS);
    });

    it('goes on from the same place when the list moves between finding it and reading it', async () => {
        // Stopped inside a block too large to be read whole
        const rows = blocks([[900, 1300], [899, 30]]);
        const explorer = explorerOf(rows);
        const first = await findTransfers(explorer.read, null);
        expect(first.next.skip).toBeGreaterThan(0);
        // After the first request, 1,000 more on top before every one
        let current = rows;
        let block = 10000;
        let requests = 0;
        const moving: TExplorerPage = (page, limit) => {
            if (requests++ > 0) {
                current = [...blocks([[block++, 1000]]), ...current];
                explorer.replace(current);
            }
            return explorer.read(page, limit);
        };
        const page = await findTransfers(moving, first.next);
        expect(page.found).toEqual([]);
        expect(page.next).toEqual({ ...first.next, position: first.next.position });
    });

    it('gives up looking for where it stopped when the list never settles', async () => {
        // Every page, however far, holds only rows newer than where it stopped
        let reads = 0;
        const endless: TExplorerPage = async page => {
            reads++;
            return { total: 1e9, rows: Array.from({ length: EXPLORER_PAGE_SIZE }, (_, i) => ({ hash: (page * 1000 + i).toString(16).padStart(64, '0'), block: 1e9 - page, contract: 'UTXO_Tx', ecosystem: '1' })) };
        };
        await expect(findTransfers(endless, { block: 5, position: 0, skip: 0, after: '' })).rejects.toThrow('kept moving');
        expect(reads).toBeLessThanOrEqual(40);
    });

    it('looks up so many transfers at a time at most, going on inside a block with more', async () => {
        // Transfers only: a block of 300 read whole, then one too large to be
        const utxo = (sizes: [number, number][]) => blocks(sizes).map(row => ({ ...row, contract: 'UTXO_Tx' }));
        for (const rows of [utxo([[900, 10], [899, 300], [898, 20]]), utxo([[900, 10], [899, 1300], [898, 20]])]) {
            const explorer = explorerOf(rows);
            const found: string[] = [];
            let checked = 0;
            let cursor: IExplorerCursor | null = null;
            for (let pages = 0; ; pages++) {
                expect(pages).toBeLessThan(100);
                const before = explorer.calls();
                const page = await findTransfers(explorer.read, cursor);
                expect(page.found.length).toBeLessThanOrEqual(UTXO_LOOKUPS);
                // Going on inside a block too large to be read whole: as far as the page needs, not
                // EXPLORER_REQUESTS pages to use 50 of their rows (on the testnet 0.6 s a request)
                if (cursor && cursor.skip > 0) {
                    expect(explorer.calls() - before).toBeLessThanOrEqual(3);
                }
                found.push(...page.found.map(row => row.hash));
                checked += page.checked;
                cursor = page.next;
                if (!cursor) {
                    break;
                }
            }
            expect(checked).toBeLessThanOrEqual(rows.length);
            if (330 === rows.length) {
                // Read whole: every transfer once, each row counted once
                expect(new Set(found).size).toBe(found.length);
                expect(found.sort()).toEqual(transfers(rows));
                expect(checked).toBe(rows.length);
            }
            else {
                // Too large: its rows come in another order each time, so some come again (the
                // wallet shows a transfer once) and some never (the block is reported); the rest all
                const outside = transfers(rows.filter(row => 899 !== row.block));
                expect(outside.filter(hash => !found.includes(hash))).toEqual([]);
                expect(found.filter(hash => outside.includes(hash)).length).toBe(outside.length);
            }
        }
    });

    it('reports a block too large to read whole, and goes on past it', async () => {
        const rows = blocks([[900, 40], [899, 1300], [898, 50]]);
        const result = await walk(explorerOf(rows).read);
        expect(result.incomplete).toContain('899');
        // A row read twice while going through it is counted once
        expect(result.checked).toBeLessThanOrEqual(rows.length);
        // Every transfer outside it is found
        const outside = transfers(rows.filter(row => 899 !== row.block));
        expect(outside.every(hash => result.found.includes(hash))).toBe(true);
    });

    it('ends with the list, and with an empty one', async () => {
        expect(await findTransfers(explorerOf([]).read, null)).toEqual({ found: [], next: null, checked: 0, total: 0, incomplete: [] });
        const rows = blocks([[5, 6]]);
        const result = await findTransfers(explorerOf(rows).read, null);
        expect(result.next).toBeNull();
        expect(result.checked).toBe(6);
    });
});

describe('UTXO transfers', () => {
    it('reads a page of the explorer\'s list of an account\'s transactions', () => {
        const answer = { code: 0, data: { total: 34, page: 1, limit: 2, list: [
            { hash: REWARD_HASH, block_id: 2545, contract_name: 'UTXO_Tx', timestamp: 1684717208, address: '1634-8099-0439-6342-1518', status: 0, ecosystem_name: 'platform ecosystem', ecosystem: 1 },
            { hash: '62401f2515311653832dd17485c54334680d7d22061e9c4b8af11d406099fa5f', block_id: 2544, contract_name: '@1TokensApprove', timestamp: 1751447007, address: RECIPIENT, status: 1, ecosystem: 1 }
        ] }, message: 'Success' };
        expect(parseExplorerPage(answer, 100)).toEqual({
            total: 34,
            rows: [rewardRow, { hash: '62401f2515311653832dd17485c54334680d7d22061e9c4b8af11d406099fa5f', block: 2544, contract: '@1TokensApprove', ecosystem: '1' }]
        });
        expect(parseExplorerPage({ code: 0, data: { total: 0, list: null } }, 100)).toEqual({ total: 0, rows: [] });
    });

    it('refuses an explorer answer it cannot read, or out of block order', () => {
        const row = { hash: REWARD_HASH, block_id: 2545, contract_name: 'UTXO_Tx', ecosystem: 1 };
        for (const broken of [
            null, { code: 1, data: { total: 0, list: [] } }, { code: 0 }, { code: 0, data: { total: '3', list: [] } },
            { code: 0, data: { total: -1, list: [] } },
            { code: 0, data: { total: 1, list: [{ ...row, hash: 'ab' }] } },
            { code: 0, data: { total: 1, list: [{ ...row, block_id: '2545' }] } },
            { code: 0, data: { total: 1, list: [{ ...row, ecosystem: 0 }] } },
            { code: 0, data: { total: 1, list: [{ ...row, contract_name: null }] } },
            { code: 0, data: { total: 3, list: [row, row, row] } },
            { code: 0, data: { total: 2, list: [{ ...row, block_id: 7 }, { ...row, block_id: 8 }] } }
        ]) {
            expect([broken, parseExplorerPage(broken, 2)]).toEqual([broken, null]);
        }
    });

    it('takes a transfer as the node records it, received or sent, with the recipient exact', () => {
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT), parseAddress(RECIPIENT))).toEqual({
            hash: REWARD_HASH, blockID: '2545', time: 1684717208771, direction: 'in', counterparty: '1634-8099-0439-6342-1518',
            amount: '100000000000000', comment: 'Rewards of 9th, May. TG winner', failed: false
        });
        // The node writes ToID as a bare JSON number past 2^53: JSON.parse rounds it, so it is read
        // from the text. Rounded, it would be another address.
        expect(String(JSON.parse(SENT_TEXT).data.params.utxo.ToID)).not.toBe('-868164129336259442');
        expect(verifyUtxoTransfer(sentRow, node(SENT_TEXT), parseAddress(SENDER))).toMatchObject({
            direction: 'out', counterparty: '1757-8579-9443-7329-2174', amount: '1', comment: '', failed: false
        });
        // 2^64 - 868164129336259442 = 17578579944373292174
        expect(parseAddress('1757-8579-9443-7329-2174')).toBe('-868164129336259442');
    });

    it('takes an amount written with leading zeros, and one as large as 2^256 allows', () => {
        const recipient = parseAddress(RECIPIENT);
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"000123"')), recipient)).toMatchObject({ amount: '123' });
        const largest = '9'.repeat(78);
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT.replace('"Value":"100000000000000"', `"Value":"${largest}"`)), recipient)).toMatchObject({ amount: largest });
    });

    it('is not misled by a ToID written in the comment', () => {
        const text = REWARD_TEXT.replace('"Comment":"Rewards of 9th, May. TG winner"', '"Comment":"\\"ToID\\":5"');
        expect(verifyUtxoTransfer(rewardRow, node(text), parseAddress(RECIPIENT))).toMatchObject({ direction: 'in', comment: '"ToID":5' });
    });

    it('keeps a sender\'s comment from disguising itself', () => {
        const text = REWARD_TEXT.replace('Rewards of 9th, May. TG winner', 'pay\\u202Efor\\u200B rent');
        expect(verifyUtxoTransfer(rewardRow, node(text), parseAddress(RECIPIENT))).toMatchObject({ comment: 'pay for rent' });
    });

    it('tells a transfer between two other accounts, and one the node does not have', () => {
        // The testnet's node account earned this transfer's fee
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT), parseAddress(SENDER))).toBe('other');
        expect(verifyUtxoTransfer(rewardRow, node(UNKNOWN_TEXT), parseAddress(RECIPIENT))).toBe('unknown');
    });

    it('marks a transfer the node recorded as failed', () => {
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT.replace('"status":0', '"status":1')), parseAddress(RECIPIENT))).toMatchObject({ failed: true });
    });

    it('refuses a record that does not match the explorer\'s row', () => {
        const recipient = parseAddress(RECIPIENT);
        for (const [what, row, text] of [
            ['another transaction', { ...rewardRow, hash: SENT_HASH }, REWARD_TEXT],
            ['another block', { ...rewardRow, block: 2546 }, REWARD_TEXT],
            ['another ecosystem', { ...rewardRow, ecosystem: '2' }, REWARD_TEXT],
            ['not a UTXO transfer', rewardRow, REWARD_TEXT.replace('"params":{"utxo":{', '"params":{"x":{')],
            ['two recipients', rewardRow, REWARD_TEXT.replace('"Comment":"Rewards', '"ToID":5,"Comment":"Rewards')],
            ['a ToID outside the transfer', rewardRow, REWARD_TEXT.replace('"ToID":-6561781177931602744,', '').replace('"expedite":"0"', '"expedite":"0","meta":{"ToID":-6561781177931602744}')],
            ['a recipient that is no int64', rewardRow, REWARD_TEXT.replace('-6561781177931602744', '-99999999999999999999')],
            ['a recipient that is no integer', rewardRow, REWARD_TEXT.replace('-6561781177931602744', '-6561781177931602744.5')],
            ['an amount that is not one', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"1.5"')],
            ['a negative amount', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"-1"')],
            ['nothing transferred', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"0"')],
            ['nothing transferred, in zeros', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"000"')],
            ['an amount past 2^256', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', `"Value":"${'9'.repeat(79)}"`)],
            ['a comment that is no text', rewardRow, REWARD_TEXT.replace('"Comment":"Rewards of 9th, May. TG winner"', '"Comment":5')],
            ['an unknown status', rewardRow, REWARD_TEXT.replace('"status":0', '"status":7')],
            ['a date no clock can show', rewardRow, REWARD_TEXT.replace('1684717208771', '99999999999999999')],
            ['a date before 1970', rewardRow, REWARD_TEXT.replace('1684717208771', '-1')],
            ['a sender that is no address', rewardRow, REWARD_TEXT.replace('"address":"1634-8099-0439-6342-1518"', '"address":"1634"')],
            ['a sender that is no text', rewardRow, REWARD_TEXT.replace('"address":"1634-8099-0439-6342-1518"', '"address":5')]
        ] as [string, IExplorerRow, string][]) {
            expect([what, verifyUtxoTransfer(row, node(text), recipient)]).toEqual([what, 'mismatch']);
        }
    });
});
