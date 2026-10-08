/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import {
    EXPLORER_PAGE_SIZE, EXPLORER_REQUESTS, EXPLORER_WINDOW, findTransfers, UTXO_LOOKUPS, IExplorerCursor, IExplorerRow, TExplorerPage, UTXO_PAGE_SIZE
} from './utxoHistory';

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
        expect(page.next).toEqual(first.next);
    });

    it('finds where it stopped when the block begins a page exactly', async () => {
        // Block 897 begins at row 200, the first of page 3; the hint says page 5
        const rows = blocks([[900, 100], [899, 50], [898, 50], [897, 120], [896, 30]]);
        const explorer = explorerOf(rows);
        const page = await findTransfers(explorer.read, { block: 897, position: 450, skip: 0, after: '' });
        const older = transfers(rows.filter(row => row.block <= 897));
        expect(page.found.map(row => row.hash).sort()).toEqual(older.slice(0, page.found.length));
        expect(page.found.every(row => row.block <= 897)).toBe(true);
        expect(page.found.length).toBeGreaterThan(0);
    });

    it('goes on from the page the block begins when the hint is that page and the one before is newer', async () => {
        // Block 897 begins at row 200, the first of page 3, and the hint says page 3: page 2 is read
        // next, all newer, and it goes back to page 3 rather than from page 2
        const rows = blocks([[900, 100], [899, 50], [898, 50], [897, 120], [896, 30]]);
        const explorer = explorerOf(rows);
        const page = await findTransfers(explorer.read, { block: 897, position: 200, skip: 0, after: '' });
        const older = transfers(rows.filter(row => row.block <= 897));
        expect(page.found.map(row => row.hash).sort()).toEqual(older.slice(0, page.found.length));
        expect(page.found.length).toBeGreaterThan(0);
        expect(page.checked).toBeLessThanOrEqual(rows.filter(row => row.block <= 897).length);
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

    it('reports a block only when no one request can hold it, and misses nothing outside one', async () => {
        // Pages are aligned to their size: a block lying across the edge of every window of up to
        // EXPLORER_WINDOW rows (277 to 633: no window under 634 holds it) cannot be read whole,
        // however small. Any other block must be read whole.
        const readable = (start: number, count: number) => Array.from({ length: EXPLORER_WINDOW - count + 1 }, (_, i) => count + i)
            .some(n => Math.floor(start / n) === Math.floor((start + count - 1) / n));
        let seed = 1;
        const random = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
        for (let layout = 0; layout < 20; layout++) {
            const sizes = Array.from({ length: 8 }, (_, i): [number, number] => [5000 - i, 1 + Math.floor(random() * 400)]);
            const rows = blocks(sizes);
            const result = await walk(explorerOf(rows).read);
            let start = 0;
            const unreadable = sizes.filter(([, count]) => {
                const across = !readable(start, count);
                start += count;
                return across;
            }).map(([block]) => String(block));
            expect([layout, [...new Set(result.incomplete)].sort()]).toEqual([layout, unreadable.sort()]);
            const outside = transfers(rows.filter(row => !unreadable.includes(String(row.block))));
            expect([layout, outside.filter(hash => !result.found.includes(hash))]).toEqual([layout, []]);
        }
    }, 60000);

    it('reads whole blocks a list growing on top moved while reading them', async () => {
        const rows = blocks([[900, 120], [899, 80], [898, 110], [897, 95], [896, 70]]);
        const explorer = explorerOf(rows);
        let current = rows;
        let reads = 0;
        let block = 10000;
        // A transaction on top every third request
        const moving: TExplorerPage = (page, limit) => {
            if (0 === ++reads % 3) {
                current = [...blocks([[block++, 1]]), ...current];
                explorer.replace(current);
            }
            return explorer.read(page, limit);
        };
        const found = new Set<string>();
        const incomplete: string[] = [];
        let cursor: IExplorerCursor | null = null;
        for (let pages = 0; ; pages++) {
            expect(pages).toBeLessThan(100);
            const page = await findTransfers(moving, cursor);
            page.found.forEach(row => found.add(row.hash));
            incomplete.push(...page.incomplete.map(item => item.blockID));
            cursor = page.next;
            if (!cursor) {
                break;
            }
        }
        expect(incomplete).toEqual([]);
        expect(transfers(rows).filter(hash => !found.has(hash))).toEqual([]);
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
