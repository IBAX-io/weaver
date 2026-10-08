/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The network's block explorer (IBAX Scan, scan.ibax.network / testscan.ibax.network), which
// indexes every account's transactions. Its API as its own web app calls it (no published
// documentation): POST {base}/account_detail_tx with JSON {wallet, ecosystem, page, limit} answers
// {code: 0, data: {total, page, limit, list}}, newest first, every kind of transaction of the
// account, sent or received. Callers check what it answers: it is an index, not the chain.

import { isHttpsUrl } from 'lib/settings/httpsUrl';

interface IAccountTransactionsRequest {
    // "XXXX-XXXX-XXXX-XXXX-XXXX"
    wallet: string;
    ecosystem: number;
    // From 1
    page: number;
    limit: number;
}

// How long an answer may take, and how large it may be: a page of 500 rows is about 125 KB
const EXPLORER_TIMEOUT_MS = 15000;
export const EXPLORER_MAX_BYTES = 2 * 1024 * 1024;

export default class ExplorerAPI {
    private base: string;
    private fetch: typeof fetch;

    // The account's address is sent there: over https only, whatever stored the address
    constructor(base: string, fetchFunction: typeof fetch = (input, init) => fetch(input, init)) {
        if (!isHttpsUrl(base)) {
            throw new Error('A block explorer is called over https only');
        }
        this.base = base.replace(/\/+$/, '');
        this.fetch = fetchFunction;
    }

    // The response's JSON as it came (null when it is not JSON), or a thrown { error }: E_OFFLINE
    // when the explorer cannot be reached or does not answer in time, E_SERVER when it answers with
    // an error status, a redirect, or more than it could mean. No cookies or credentials go with
    // the request, and a redirect is not followed: the address goes to the configured host only.
    public accountTransactions = async (request: IAccountTransactionsRequest): Promise<unknown> => {
        let text: string;
        try {
            const response = await this.fetch(`${this.base}/account_detail_tx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
                credentials: 'omit',
                redirect: 'error',
                signal: AbortSignal.timeout(EXPLORER_TIMEOUT_MS)
            });
            if (!response.ok) {
                throw { error: 'E_SERVER' };
            }
            text = await readLimited(response);
        }
        catch (e) {
            throw e && 'E_SERVER' === (e as { error?: string }).error ? e : { error: 'E_OFFLINE' };
        }
        try {
            return JSON.parse(text);
        }
        catch (e) {
            return null;
        }
    };
}

// The body as text, read no further than EXPLORER_MAX_BYTES: a larger one, said up front or found
// while reading, is refused without being held whole
const readLimited = async (response: Response) => {
    const declared = Number(response.headers.get('Content-Length'));
    if (declared > EXPLORER_MAX_BYTES) {
        throw { error: 'E_SERVER' };
    }
    if (!response.body) {
        return '';
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let text = '';
    for (;;) {
        const { done, value } = await reader.read();
        if (done) {
            return text + decoder.decode();
        }
        received += value.byteLength;
        if (received > EXPLORER_MAX_BYTES) {
            await reader.cancel();
            throw { error: 'E_SERVER' };
        }
        text += decoder.decode(value, { stream: true });
    }
};
