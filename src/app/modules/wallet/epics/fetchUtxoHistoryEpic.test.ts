/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Action } from 'redux';
import { Subject } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { runEpic, runEpicLoop } from 'test/runEpic';
import mockState from 'test/mockStore';
import storeDependencies from 'modules/dependencies';
import { IRootState } from 'modules';
import IbaxAPI from 'lib/ibaxAPI';
import ExplorerAPI from 'lib/explorer';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { formatAddress, parseAddress } from 'lib/crypto/address';
import { logout } from 'modules/auth/actions';
import { E_INVALIDWALLET, E_NO_EXPLORER, fetchUtxoHistory, IUtxoHistoryRequest, sendTransfer, E_NOT_ALLOWED } from '../actions';
import { explorerConsent } from '../selectors';
import reducer, { initialState } from '../reducer';
import { TUtxoHistoryEntry } from '../utxoTransfer';
import { fetchUtxoHistoryEpic, reloadUtxoHistoryEpic } from './fetchUtxoHistoryEpic';

const OWNER = { account: '1188-4962-8957-7794-8872', ecosystem: '1' };
const ME = parseAddress(OWNER.account);
const OTHER = '5555';
const EXPLORER = 'https://scan.example/api/v2';

// explorer '': the network has none configured; allowed: the user agreed to send it the address
const signedIn = (explorer = EXPLORER, allowed = true): IRootState => ({
    ...mockState,
    auth: {
        ...mockState.auth,
        session: { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE },
        wallet: {
            wallet: { id: '1', walletID: '1', address: OWNER.account, encKey: '', publicKey: '', access: [] },
            access: { ecosystem: OWNER.ecosystem, name: '', roles: [], notifications: [] }
        }
    },
    storage: {
        ...mockState.storage,
        explorerAllowed: allowed && explorer ? [explorerConsent('testnet', explorer)] : [],
        networks: [
            { uuid: 'mainnet', id: 7, name: 'Mainnet', honorNodes: ['http://main'], explorer: 'https://scan.main/api/v2' },
            { uuid: 'testnet', id: 5, name: 'Testnet', honorNodes: ['http://node'], explorer: explorer || undefined }
        ]
    }
});

// A transaction's hash from a number
const hash = (n: number) => n.toString(16).padStart(64, '0');

// The account's transactions in the explorer, one a block, newest first: UTXO transfers where
// `utxo` says, other contracts elsewhere; and the node's record of every UTXO transfer
const chain = (count: number, utxo: (n: number) => boolean, record: (n: number) => { sender: string, recipient: string, status?: number } | 'unknown' = () => ({ sender: OTHER, recipient: ME })) => {
    const rows = Array.from({ length: count }, (_, i) => count - i).map(n => ({
        hash: hash(n), block_id: n, contract_name: utxo(n) ? 'UTXO_Tx' : '@1TokensSend', ecosystem: 1
    }));
    const explorer = new ExplorerAPI(EXPLORER);
    vi.spyOn(explorer, 'accountTransactions').mockImplementation(async ({ page, limit }) => ({
        code: 0, data: { total: count, list: rows.slice((page - 1) * limit, page * limit) }
    }));
    const node = new IbaxAPI({ apiHost: 'http://node' });
    let inFlight = 0;
    let mostInFlight = 0;
    vi.spyOn(node, 'txInfo').mockImplementation(async ({ hash: wanted }) => {
        inFlight++;
        mostInFlight = Math.max(mostInFlight, inFlight);
        await new Promise(resolve => setTimeout(resolve, 1));
        inFlight--;
        const n = parseInt(wanted, 16);
        const answer = record(n);
        // What the node answers for a transaction it does not have
        const text = 'unknown' === answer ? '{"blockid":"","confirm":0}'
            : `{"data":{"block_id":${n},"address":"${formatAddress(answer.sender)}","ecosystem":1,"hash":"${wanted}","params":{"utxo":{"ToID":${answer.recipient},"Value":"${n}","Comment":""}},"created_at":${n * 1000},"status":${answer.status || 0}}}`;
        return { json: JSON.parse(text), text };
    });
    const api = vi.fn(() => node);
    const index = vi.fn(() => explorer);
    return { explorer, node, mostInFlight: () => mostInFlight, dependencies: { api, explorer: index } };
};

const request = (cursor: IUtxoHistoryRequest['cursor'] = null): IUtxoHistoryRequest => ({ ...OWNER, cursor });
const result = (output: Action[]) => (output.find(action => fetchUtxoHistory.done.match(action)) as ReturnType<typeof fetchUtxoHistory.done>).payload.result;

describe('fetchUtxoHistoryEpic', () => {
    afterEach(() => vi.useRealTimers());

    it('finds the account\'s UTXO transfers in the network\'s explorer, newest first, each looked up in the node', async () => {
        // 150 transactions, every third a UTXO transfer
        const { explorer, node, mostInFlight, dependencies } = chain(150, n => 0 === n % 3);
        const page = result(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn(), dependencies));
        expect(page.entries.map(entry => entry.blockID)).toEqual(Array.from({ length: 25 }, (_, i) => String(150 - 3 * i)));
        expect(page.entries[0]).toEqual({
            hash: hash(150), blockID: '150', time: 150000, direction: 'in', counterparty: formatAddress(OTHER), amount: '150', comment: '', failed: false
        });
        // Goes on with the blocks older than the 25th transfer's
        expect(page.next).toEqual({ block: 77, position: 73, skip: 0, after: '' });
        expect(page.total).toBe(150);
        // The network's own explorer and node, asked for this account and ecosystem
        expect(dependencies.explorer).toHaveBeenCalledWith(EXPLORER);
        expect(dependencies.api).toHaveBeenCalledWith({ apiHost: 'http://node' });
        expect(explorer.accountTransactions).toHaveBeenCalledWith({ wallet: OWNER.account, ecosystem: 1, page: 1, limit: 100 });
        // Five node lookups at a time at most
        expect(node.txInfo).toHaveBeenCalledTimes(25);
        expect(mostInFlight()).toBeLessThanOrEqual(5);
    });

    it('goes on where the last page stopped, to the end of the list', async () => {
        const { dependencies } = chain(150, n => 0 === n % 3);
        const page = result(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request({ block: 77, position: 73, skip: 0, after: '' }))], signedIn(), dependencies));
        expect(page.entries.map(entry => entry.blockID)).toEqual(Array.from({ length: 25 }, (_, i) => String(75 - 3 * i)));
        // Blocks 2 and 1 are left, without a transfer: one more page, and the list ends
        expect(page.next).toEqual({ block: 2, position: 148, skip: 0, after: '' });
        const last = result(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request(page.next))], signedIn(), dependencies));
        expect(last).toEqual({ entries: [], next: null, checked: 2, total: 150, incomplete: [] });
    });

    it('shows a transfer the node does not have yet as such, and leaves out one between other accounts', async () => {
        const { dependencies } = chain(4, () => true, n => 4 === n ? 'unknown' : 3 === n ? { sender: OTHER, recipient: '7' } : 2 === n ? { sender: ME, recipient: OTHER, status: 1 } : { sender: ME, recipient: ME });
        const page = result(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn(), dependencies));
        expect(page.entries).toEqual([
            { hash: hash(4), blockID: '4', problem: 'unconfirmed' },
            expect.objectContaining({ blockID: '2', direction: 'out', failed: true }),
            expect.objectContaining({ blockID: '1', direction: 'self', failed: false })
        ]);
    });

    it('shows a listed transfer the node records otherwise by its hash alone, and the rest of the page as it is', async () => {
        const { node, dependencies } = chain(3, () => true);
        vi.mocked(node.txInfo).mockImplementationOnce(async () => {
            const text = `{"data":{"block_id":99,"address":"${OWNER.account}","ecosystem":1,"hash":"${hash(3)}","params":{"utxo":{"ToID":5,"Value":"1"}},"created_at":1,"status":0}}`;
            return { json: JSON.parse(text), text };
        });
        const page = result(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn(), dependencies));
        expect(page.entries).toEqual([
            { hash: hash(3), blockID: '3', problem: 'mismatch' },
            expect.objectContaining({ blockID: '2', direction: 'in' }),
            expect.objectContaining({ blockID: '1', direction: 'in' })
        ]);
    });

    it('reports the node\'s error, and an explorer page of another ecosystem or one it cannot read', async () => {
        const failing = chain(1, () => true);
        vi.mocked(failing.node.txInfo).mockRejectedValueOnce({ error: 'E_SERVER', msg: 'not found' });
        expect(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn(), failing.dependencies))
            .toEqual([fetchUtxoHistory.failed({ params: request(), error: 'E_SERVER' })]);
        for (const answer of [{ code: 0, data: { total: 1, list: [{ hash: hash(1), block_id: 1, contract_name: 'UTXO_Tx', ecosystem: 2 }] } }, { code: 7 }]) {
            const { explorer, dependencies } = chain(1, () => true);
            vi.mocked(explorer.accountTransactions).mockResolvedValueOnce(answer);
            expect(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn(), dependencies))
                .toEqual([fetchUtxoHistory.failed({ params: request(), error: 'E_INVALID_RESPONSE' })]);
        }
    });

    it('says when the network has no block explorer to ask', async () => {
        const { explorer, dependencies } = chain(1, () => true);
        expect(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn(''), dependencies))
            .toEqual([fetchUtxoHistory.failed({ params: request(), error: E_NO_EXPLORER })]);
        expect(explorer.accountTransactions).not.toHaveBeenCalled();
    });

    it('answers only the newest request, and nothing after signing out', async () => {
        const { dependencies } = chain(30, () => true);
        const twice = await runEpicLoop(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request()), fetchUtxoHistory.started(request({ block: 10, position: 20, skip: 0, after: '' }))], { state: signedIn(), dependencies });
        expect(twice.filter(action => fetchUtxoHistory.done.match(action)).map(action => (action as ReturnType<typeof fetchUtxoHistory.done>).payload.params.cursor))
            .toEqual([{ block: 10, position: 20, skip: 0, after: '' }]);
        const out = await runEpicLoop(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request()), logout.started(null)], { state: signedIn(), dependencies });
        expect(out.filter(action => fetchUtxoHistory.done.match(action) || fetchUtxoHistory.failed.match(action))).toEqual([]);
    });

    it('starts the open wallet\'s UTXO transfers over after a UTXO transfer, again while the explorer has not listed it', async () => {
        vi.useFakeTimers();
        const state = signedIn();
        state.wallet = { ...state.wallet, utxoHistory: { ...OWNER, entries: [], next: null, checked: 0, total: 0, incomplete: [] } };
        const state$ = new StateObservable<IRootState>(new Subject<IRootState>(), state);
        const action$ = new Subject<Action>();
        const out: Action[] = [];
        reloadUtxoHistoryEpic(action$, state$, storeDependencies).subscribe(action => out.push(action));
        const sent = (type: 'utxo' | 'transferSelf') => sendTransfer.done({
            params: { transfer: 'utxo' === type ? { type, toID: '1', amount: '1' } : { type, amount: '1', direction: 'toUTXO' }, confirm: { title: '', description: '' } },
            result: { hash: 'ab12' }
        });

        // A move is in the history, not here
        action$.next(sent('transferSelf'));
        expect(out).toEqual([]);

        action$.next(sent('utxo'));
        expect(out).toEqual([fetchUtxoHistory.started(request())]);
        // Not listed yet: looked for again
        await vi.advanceTimersByTimeAsync(5000);
        expect(out).toHaveLength(2);
        // Listed, the node not confirming it yet: looked for again
        state.wallet = { ...state.wallet, utxoHistory: { ...state.wallet.utxoHistory, entries: [{ hash: 'ab12', blockID: '1', problem: 'unconfirmed' }] } };
        await vi.advanceTimersByTimeAsync(15000);
        expect(out).toHaveLength(3);
        // Confirmed now: no more
        state.wallet = { ...state.wallet, utxoHistory: { ...state.wallet.utxoHistory, entries: [{ ...transferEntry, hash: 'ab12' }] } };
        await vi.advanceTimersByTimeAsync(60000);
        expect(out).toHaveLength(3);
    });

    it('looks again neither while a page loads nor once signed out', async () => {
        vi.useFakeTimers();
        const state = signedIn();
        state.wallet = { ...state.wallet, utxoHistory: { ...OWNER, entries: [], next: null, checked: 0, total: 0, incomplete: [] }, utxoHistoryPending: true };
        const state$ = new StateObservable<IRootState>(new Subject<IRootState>(), state);
        const action$ = new Subject<Action>();
        const out: Action[] = [];
        reloadUtxoHistoryEpic(action$, state$, storeDependencies).subscribe(action => out.push(action));
        action$.next(sendTransfer.done({ params: { transfer: { type: 'utxo', toID: '1', amount: '1' }, confirm: { title: '', description: '' } }, result: { hash: 'ab12' } }));
        expect(out).toHaveLength(1);
        // Loading: not sent again
        await vi.advanceTimersByTimeAsync(5000);
        expect(out).toHaveLength(1);
        // Signed out: never again
        state.wallet = { ...state.wallet, utxoHistoryPending: false };
        action$.next(logout.started(null));
        await vi.advanceTimersByTimeAsync(60000);
        expect(out).toHaveLength(1);
    });

    it('sends the address nowhere the user did not agree to, nor over plain http', async () => {
        const { dependencies } = chain(3, () => true);
        // Not agreed; agreed for the network's earlier explorer (its settings changed since)
        const earlier = { ...signedIn(EXPLORER, false), storage: { ...signedIn(EXPLORER, false).storage, explorerAllowed: [explorerConsent('testnet', 'https://old.example/api/v2')] } };
        for (const state of [signedIn(EXPLORER, false), earlier]) {
            expect(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], state, dependencies))
                .toEqual([fetchUtxoHistory.failed({ params: request(), error: E_NOT_ALLOWED })]);
        }
        // An http address stored some other way than the network form: as no explorer
        expect(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(request())], signedIn('http://scan.example/api/v2'), dependencies))
            .toEqual([fetchUtxoHistory.failed({ params: request(), error: E_NO_EXPLORER })]);
        expect(dependencies.explorer).not.toHaveBeenCalled();
    });

    it('fails an address it cannot read', async () => {
        const state = signedIn();
        const bad = { account: 'not an address', ecosystem: '1', cursor: null };
        expect(await runEpic(fetchUtxoHistoryEpic, [fetchUtxoHistory.started(bad)], state))
            .toEqual([fetchUtxoHistory.failed({ params: bad, error: E_INVALIDWALLET })]);
    });
});

// A transfer the node confirmed
const transferEntry: TUtxoHistoryEntry = { hash: hash(1), blockID: '1', time: 1, direction: 'in', counterparty: null, amount: '1', comment: '', failed: false };

describe('UTXO transfers in the wallet state', () => {
    const transfer = (id: number): TUtxoHistoryEntry => ({ hash: hash(id), blockID: String(id), time: id, direction: 'in', counterparty: null, amount: '1', comment: '', failed: false });
    const NEXT = { block: 7, position: 40, skip: 0, after: '' };
    const page = (cursor: IUtxoHistoryRequest['cursor'], ids: number[], next: IUtxoHistoryRequest['cursor'], checked: number, incomplete: string[] = []) =>
        fetchUtxoHistory.done({ params: request(cursor), result: { entries: ids.map(transfer), next, checked, total: 900, incomplete: incomplete.map(blockID => ({ blockID, count: 600 })) } });
    const loaded = reducer(reducer(initialState, fetchUtxoHistory.started(request())), page(null, [9, 8], NEXT, 100, ['8']));

    it('adds the next page, a transfer and a block once each', () => {
        const more = reducer(reducer(loaded, fetchUtxoHistory.started(request(NEXT))), page(NEXT, [8, 7, 7], null, 60, ['8', '7']));
        expect(more.utxoHistory.entries.map(entry => entry.blockID)).toEqual(['9', '8', '7']);
        // A block gone through over two pages: the rows of both counted
        expect(more.utxoHistory.incomplete).toEqual([{ blockID: '8', count: 1200 }, { blockID: '7', count: 600 }]);
        expect(more.utxoHistory.next).toBeNull();
        expect(more.utxoHistory.checked).toBe(160);
        expect(more.utxoHistory.total).toBe(900);
        expect(more.utxoHistoryPending).toBe(false);
    });

    it('drops a page that no longer follows, and starts over from the newest', () => {
        expect(reducer(loaded, page({ block: 3, position: 1, skip: 0, after: '' }, [1], null, 10)).utxoHistory.entries.map(entry => entry.blockID)).toEqual(['9', '8']);
        // Going on inside the same block from another transfer is another place
        expect(reducer(loaded, page({ ...NEXT, after: hash(5) }, [1], null, 10)).utxoHistory.entries.map(entry => entry.blockID)).toEqual(['9', '8']);
        const over = reducer(reducer(loaded, fetchUtxoHistory.started(request())), page(null, [10], null, 5));
        expect(over.utxoHistory.entries.map(entry => entry.blockID)).toEqual(['10']);
        expect(over.utxoHistory.checked).toBe(5);
        expect(over.utxoHistory.incomplete).toEqual([]);
    });

    it('keeps what failed to try it again as it was, and drops another wallet\'s failure', () => {
        const failed = reducer(reducer(loaded, fetchUtxoHistory.started(request(NEXT))), fetchUtxoHistory.failed({ params: request(NEXT), error: 'E_OFFLINE' }));
        expect(failed.utxoHistoryError).toBe('E_OFFLINE');
        expect(failed.utxoHistoryRetry).toEqual(request(NEXT));
        expect(failed.utxoHistory.entries).toHaveLength(2);
        expect(reducer(failed, fetchUtxoHistory.started(request(NEXT))).utxoHistoryError).toBeNull();
        const other = reducer(loaded, fetchUtxoHistory.failed({ params: { ...request(), ecosystem: '2' }, error: 'E_OFFLINE' }));
        expect(other).toBe(loaded);
    });
});
