/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// An account's UTXO transfers between accounts (transaction type 5, UtxoToken), sent or received.
// The node writes no history row for them and no API of the node lists them, so they are found in
// the network's block explorer, which indexes every account's transactions (lib/explorer), and
// each one is then checked against the node (GET /txinfo/{hash}?contractinfo=true): only what the
// node confirms — sender, recipient, amount, ecosystem, block — is shown. The explorer answers
// "which", the node answers "what".
//
// Going through the explorer's list. It sorts by block, newest first (at up to 500 rows a page; not
// above), but the transactions of one block come in an order that differs from one request to the
// next. So paging by page number alone repeats some of a block's rows and never shows others where
// a block runs over two pages (measured on the testnet: 57 rows twice and 49 never, in an account's
// 101,758). What does not move is where a block lies in the list: after every newer block's rows.
// So a block read over two pages is read again in one request whose window holds all of it (told by
// the window beginning and ending with other blocks), and going on is "the blocks older than the
// last one gone through", with the position only a hint (the list moves when transactions are
// added). A block that no window of one request holds (more than 500 of the account's transactions,
// on the testnet only in a load test; or, with fewer, lying across every window's edge) cannot be
// read whole: it is reported.


// How the explorer names a UTXO transfer between accounts (a move between the account's own
// balances is UTXO_Transfer_Self, which the history table already has)
const UTXO_TRANSFER = 'UTXO_Tx';

// Explorer rows asked for at a time
export const EXPLORER_PAGE_SIZE = 100;
// The most rows one explorer request holds in block order: no larger block can be read whole
export const EXPLORER_WINDOW = 500;
// Reads of a block across page edges at most (the list moving under it between them)
const WINDOW_ATTEMPTS = 3;
// Explorer requests per page of transfers at most: transfers can be few among other transactions
export const EXPLORER_REQUESTS = 12;
// Transfers shown at a time (each one is checked against the node)
export const UTXO_PAGE_SIZE = 25;
// Transfers looked up in the node at a time at most: a block's transfers are gone through whole up
// to this many; more, and the block is gone on with on the next page
export const UTXO_LOOKUPS = 2 * UTXO_PAGE_SIZE;

export interface IExplorerRow {
    hash: string;
    block: number;
    contract: string;
    ecosystem: string;
}

// Where to go on in the explorer's list: with the transactions of `block` and older ones
export interface IExplorerCursor {
    block: number;
    // Where `block` began in the list: a hint, the list moves as transactions are added or removed
    position: number;
    // Rows of `block` already gone through: a block too large to be read whole is gone on with
    // past them (0: the block from its beginning)
    skip: number;
    // Of a block read whole, its transfers with a greater hash than this are left ('': all of them)
    after: string;
}

export type TExplorerPage = (page: number, limit: number) => Promise<{ total: number, rows: IExplorerRow[] }>;

// A block the account has more transactions in than one explorer request holds: some of them may
// not have been listed
export interface IIncompleteBlock {
    blockID: string;
    // Its transactions of the account gone through
    count: number;
}

// A page of the explorer's account_detail_tx as it answers it, or null when it is not one: its rows,
// in block order, and how many it has in all
export const parseExplorerPage = (response: unknown, limit: number): { total: number, rows: IExplorerRow[] } | null => {
    const value = response as { code?: unknown, data?: { total?: unknown, list?: unknown } };
    if (!value || 'object' !== typeof value || 0 !== value.code || !value.data || 'object' !== typeof value.data) {
        return null;
    }
    const { total, list } = value.data;
    const items = Array.isArray(list) ? list : null === list ? [] : null;
    if (!items || 'number' !== typeof total || !Number.isSafeInteger(total) || total < 0 || items.length > limit) {
        return null;
    }
    const rows = items.map(item => {
        const row = item as Record<string, unknown>;
        return row && 'string' === typeof row.hash && /^[0-9a-f]{64}$/.test(row.hash)
            && Number.isSafeInteger(row.block_id) && (row.block_id as number) > 0
            && 'string' === typeof row.contract_name
            && Number.isSafeInteger(row.ecosystem) && (row.ecosystem as number) > 0
            ? { hash: row.hash, block: row.block_id as number, contract: row.contract_name, ecosystem: String(row.ecosystem) }
            : null;
    });
    if (rows.some(row => null === row) || rows.some((row, index) => index > 0 && row.block > rows[index - 1].block)) {
        return null;
    }
    return { total, rows };
};

interface IPositioned {
    row: IExplorerRow;
    position: number;
}

// Lookups of where the cursor's block begins at most: halving, it takes about twice the log of the
// list's pages (20 for a list of 100,000 rows); more means the list keeps moving under it
const LOCATE_REQUESTS = 40;

// The account's UTXO transfer rows from the cursor on, newest first: blocks gone through whole, until
// UTXO_PAGE_SIZE transfers are found or EXPLORER_REQUESTS pages are read; where to go on (null at the
// end of the list); the account's transactions gone through; and the blocks that could not be read
// whole
export const findTransfers = async (read: TExplorerPage, cursor: IExplorerCursor | null) => {
    const size = EXPLORER_PAGE_SIZE;
    let pagesRead = 0;
    let lookups = 0;

    // Where the cursor's block begins now: the first row of it or of an older block. Transactions
    // added on top move it down, a rolled back block moves it up, by any number of pages: from the
    // page of the hint, go out doubling the step until it is passed, then halve.
    const locate = async (block: number, hint: number) => {
        // The last page known to hold only newer rows (0: none), the first one known to begin with
        // the block or an older one (or to be past the end)
        let newer = 0;
        let older = Infinity;
        let step = 1;
        let page = hint;
        for (;;) {
            if (++lookups > LOCATE_REQUESTS) {
                throw new Error('The block explorer\'s list kept moving while looking for where to go on');
            }
            const answer = await read(page, size);
            const index = answer.rows.findIndex(row => row.block <= block);
            if (index > 0 || (0 === index && 1 === page)) {
                return { page, answer, start: (page - 1) * size + index };
            }
            if (-1 === index && answer.rows.length > 0) {
                newer = Math.max(newer, page);
            }
            else {
                older = Math.min(older, page);
            }
            if (older - newer <= 1) {
                // The page that begins with it, or the end of the list: no row of it or older
                if (older === page) {
                    return { page, answer, start: (page - 1) * size + Math.max(index, 0) };
                }
                page = older;
                continue;
            }
            page = Infinity === older ? page + step
                : 0 === newer ? Math.max(1, page - step)
                : Math.floor((newer + older) / 2);
            step *= 2;
        }
    };

    let page = 1;
    let answer: { total: number, rows: IExplorerRow[] };
    // Rows from this position on are the cursor's; before it, gone through or newer
    let from = 0;
    // Where the cursor's block begins
    let blockStart = 0;
    if (cursor) {
        const found = await locate(cursor.block, Math.floor(cursor.position / size) + 1);
        page = found.page;
        answer = found.answer;
        blockStart = found.start;
        // The block it stopped inside, if it is still there: on past the rows gone through
        const first = answer.rows[blockStart - (page - 1) * size];
        from = blockStart + (first && first.block === cursor.block ? cursor.skip : 0);
        if (Math.floor(from / size) + 1 !== page) {
            page = Math.floor(from / size) + 1;
            answer = await read(page, size);
        }
    }
    else {
        answer = await read(page, size);
    }
    pagesRead++;

    let total = answer.total;
    const buffer: IPositioned[] = [];
    const taken = new Set<string>();
    // Where each block lies in the list, from every row read (the rows within it differ by request,
    // where it lies does not)
    const extents = new Map<number, [number, number]>();
    // Rows of this page not gone through yet: older than the cursor's block (or in it, from where it
    // goes on), not seen, and not newer than what is held (rows moved down a page by transactions
    // added on top)
    const take = (pageNumber: number, rows: IExplorerRow[]) => rows.forEach((row, index) => {
        const position = (pageNumber - 1) * size + index;
        const extent = extents.get(row.block);
        extents.set(row.block, extent ? [Math.min(extent[0], position), Math.max(extent[1], position)] : [position, position]);
        const held = buffer.length > 0 ? buffer[buffer.length - 1].row.block : Infinity;
        const fromCursor = !cursor || row.block < cursor.block || (row.block === cursor.block && position >= from);
        if (fromCursor && row.block <= held && !taken.has(row.hash)) {
            taken.add(row.hash);
            buffer.push({ row, position });
        }
    });
    take(page, answer.rows);
    let ended = answer.rows.length < size || page * size >= total;

    const found: IExplorerRow[] = [];
    const foundHashes = new Set<string>();
    const addFound = (rows: IExplorerRow[]) => rows.forEach(row => {
        found.push(row);
        foundHashes.add(row.hash);
    });
    const incomplete: IIncompleteBlock[] = [];
    let checked = 0;
    const isNew = (row: IExplorerRow) => UTXO_TRANSFER === row.contract && !foundHashes.has(row.hash);
    // Where a block began: the cursor's where it was found, another where it was first read
    const startOf = (block: number) => cursor && block === cursor.block ? blockStart : extents.get(block)[0];
    // The rows of one block gone through, up to UTXO_LOOKUPS transfers found in all: where to go on
    // inside the block when that cut it short
    const settle = async (rows: IPositioned[], whole: boolean): Promise<{ block: number, last: number, cut: IExplorerCursor | null }> => {
        const block = rows[0].row.block;
        const [first, last] = extents.get(block);
        const inCursor = !!cursor && block === cursor.block;
        // The block the cursor stopped inside was too large to be read whole before, and still is
        const partial = !whole || (inCursor && cursor.skip > 0);
        // Read over two requests: its rows in the order of neither. Read it again in one request
        // whose window holds it all: the window that it lies in as read (pages are aligned to
        // their size, so for some extents none of up to EXPLORER_WINDOW rows does), or else the
        // EXPLORER_WINDOW rows around its beginning. The window holds all of it when it begins
        // with a newer block (or the list) and ends with an older one (or the list), wherever the
        // list moved meanwhile; or, the list still, when it has as many of the block's rows as the
        // block spanned (a block beginning at the window's first row has no newer one before it).
        let settled: IExplorerRow[] = rows.map(item => item.row);
        let complete = true;
        if (Math.floor(first / size) !== Math.floor(last / size) || partial) {
            const extent = last - first + 1;
            complete = false;
            // A block's rows do not change, the list around it does: read again where the last
            // read found it begin, a few times
            for (let start = first, attempt = 0; !partial && extent <= EXPLORER_WINDOW && attempt < WINDOW_ATTEMPTS && !complete; attempt++) {
                const end = start + extent - 1;
                const limit = Array.from({ length: EXPLORER_WINDOW - extent + 1 }, (_, i) => extent + i).find(n => Math.floor(start / n) === Math.floor(end / n))
                    || EXPLORER_WINDOW;
                const page = Math.floor(start / limit) + 1;
                const again = await read(page, limit);
                const blockRows = again.rows.filter(row => row.block === block);
                const framed = blockRows.length > 0
                    && (1 === page || again.rows[0].block > block)
                    && (again.rows.length < limit || page * limit >= again.total || again.rows[again.rows.length - 1].block < block);
                complete = framed || blockRows.length === extent;
                if (complete) {
                    settled = blockRows;
                }
                const at = again.rows.findIndex(row => row.block === block);
                if (-1 === at || (page - 1) * limit + at === start) {
                    break;
                }
                start = (page - 1) * limit + at;
            }
        }
        const room = UTXO_LOOKUPS - found.length;

        if (complete) {
            // All its rows: gone through in the order of their hashes, which every request agrees on
            const after = inCursor ? cursor.after : '';
            const left = settled.filter(row => row.hash > after);
            const transfers = left.filter(isNew).sort((a, b) => a.hash < b.hash ? -1 : 1);
            const cutAt = transfers.length > room ? transfers[room - 1].hash : null;
            addFound(null === cutAt ? transfers : transfers.slice(0, room));
            checked += null === cutAt ? left.length : left.filter(row => row.hash <= cutAt).length;
            return { block, last, cut: null === cutAt ? null : { block, position: startOf(block), skip: 0, after: cutAt } };
        }

        // Not all of it can be read: the rows read, in the order of the list, and reported
        let cut: IExplorerCursor | null = null;
        let count = 0;
        for (const item of rows) {
            if (found.length >= UTXO_LOOKUPS) {
                cut = { block, position: startOf(block), skip: item.position - startOf(block), after: '' };
                break;
            }
            count++;
            if (isNew(item.row)) {
                addFound([item.row]);
            }
        }
        checked += count;
        incomplete.push({ blockID: String(block), count });
        return { block, last, cut };
    };

    for (;;) {
        // Every block in the buffer but the last is whole; the last too once the list has ended
        while (buffer.length > 0) {
            const block = buffer[0].row.block;
            let end = 0;
            while (end < buffer.length && buffer[end].row.block === block) {
                end++;
            }
            if (end === buffer.length && !ended) {
                break;
            }
            const done = await settle(buffer.splice(0, end), true);
            if (done.cut) {
                return { found, next: done.cut, checked, total, incomplete };
            }
            if (found.length >= UTXO_PAGE_SIZE) {
                const next = buffer.length > 0 || !ended ? { block: done.block - 1, position: done.last + 1, skip: 0, after: '' } : null;
                return { found, next, checked, total, incomplete };
            }
        }
        if (ended) {
            return { found, next: null, checked, total, incomplete };
        }
        // The block held cannot be read whole, and holds as many transfers as are looked up at a
        // time: reading on would only be read again next time
        const tooLarge = buffer.length > EXPLORER_WINDOW || (buffer.length > 0 && !!cursor && buffer[0].row.block === cursor.block && cursor.skip > 0);
        const full = tooLarge && buffer.filter(item => isNew(item.row)).length >= UTXO_LOOKUPS - found.length;
        if (pagesRead >= EXPLORER_REQUESTS || full) {
            // Nothing held: every row read was gone through before or moved down under newer ones
            // (transactions added on top while reading). Go on from the same place.
            if (0 === buffer.length) {
                return { found, next: cursor ? { ...cursor, position: blockStart } : null, checked, total, incomplete };
            }
            // What is left is one block going on past what was read. Small enough to be read whole,
            // it is read from its beginning next time; too large, it is gone through as it is and
            // gone on with past the rows read.
            const block = buffer[0].row.block;
            const start = startOf(block);
            const last = buffer[buffer.length - 1].position;
            if (tooLarge) {
                const done = await settle(buffer.splice(0), false);
                return { found, next: done.cut || { block, position: start, skip: last + 1 - start, after: '' }, checked, total, incomplete };
            }
            return { found, next: { block, position: start, skip: 0, after: cursor && block === cursor.block ? cursor.after : '' }, checked, total, incomplete };
        }
        page++;
        answer = await read(page, size);
        pagesRead++;
        total = answer.total;
        take(page, answer.rows);
        ended = answer.rows.length < size || page * size >= total;
    }
};
