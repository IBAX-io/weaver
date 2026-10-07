/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it, vi } from 'vitest';
import ExplorerAPI, { EXPLORER_MAX_BYTES } from '.';

const REQUEST = { wallet: '1188-4962-8957-7794-8872', ecosystem: 1, page: 2, limit: 100 };

const explorerAnswering = (answer: () => Promise<Response>, base = 'https://scan.example/api/v2//') => {
    const fetch = vi.fn<typeof globalThis.fetch>(answer);
    return { fetch, explorer: new ExplorerAPI(base, fetch) };
};

describe('block explorer client', () => {
    it('asks for an account\'s transactions as the explorer\'s own page does', async () => {
        const { fetch, explorer } = explorerAnswering(async () => new Response('{"code":0,"data":{"total":0,"list":null}}'));
        expect(await explorer.accountTransactions(REQUEST)).toEqual({ code: 0, data: { total: 0, list: null } });
        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe('https://scan.example/api/v2/account_detail_tx');
        expect(init.method).toBe('POST');
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
        expect(JSON.parse(init.body as string)).toEqual(REQUEST);
        // Given up on after a while, without the user's cookies, and to this host only
        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(init.credentials).toBe('omit');
        expect(init.redirect).toBe('error');
    });

    it('says the explorer could not be reached, answered an error, or answered too much', async () => {
        await expect(explorerAnswering(async () => { throw new TypeError('Failed to fetch'); }).explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_OFFLINE' });
        await expect(explorerAnswering(async () => { throw new DOMException('timed out', 'TimeoutError'); }).explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_OFFLINE' });
        await expect(explorerAnswering(async () => new Response('busy', { status: 429 })).explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_SERVER' });
        await expect(explorerAnswering(async () => new Response('x'.repeat(EXPLORER_MAX_BYTES + 1))).explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_SERVER' });
        // A redirect refused by the browser comes as a network error
        await expect(explorerAnswering(async () => { throw new TypeError('Failed to fetch: redirect mode is set to error'); }).explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_OFFLINE' });
    });

    it('stops reading an answer once it is too large, said up front or not', async () => {
        const chunk = new Uint8Array(512 * 1024).fill(0x78);
        let pulled = 0;
        let cancelled = false;
        // Endless: it must be cut off, not read whole
        const endless = new ReadableStream<Uint8Array>({
            pull: controller => { pulled++; controller.enqueue(chunk); },
            cancel: () => { cancelled = true; }
        });
        await expect(explorerAnswering(async () => new Response(endless)).explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_SERVER' });
        expect(cancelled).toBe(true);
        expect(pulled).toBeLessThanOrEqual(EXPLORER_MAX_BYTES / chunk.byteLength + 2);

        const declared = explorerAnswering(async () => new Response('{}', { headers: { 'Content-Length': String(EXPLORER_MAX_BYTES + 1) } }));
        await expect(declared.explorer.accountTransactions(REQUEST)).rejects.toEqual({ error: 'E_SERVER' });

        // Text split across chunks inside a character still reads whole
        const parts = new TextEncoder().encode('{"code":0,"note":"区块"}');
        const split = new ReadableStream<Uint8Array>({
            start: controller => { controller.enqueue(parts.slice(0, 20)); controller.enqueue(parts.slice(20)); controller.close(); }
        });
        expect(await explorerAnswering(async () => new Response(split)).explorer.accountTransactions(REQUEST)).toEqual({ code: 0, note: '区块' });
    });

    it('hands back an answer that is not JSON as nothing, for the caller to refuse', async () => {
        expect(await explorerAnswering(async () => new Response('<html>maintenance</html>')).explorer.accountTransactions(REQUEST)).toBeNull();
    });
});
