/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Action, createStore } from 'redux';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { fetchBalance, fetchHistory, fetchUtxoHistory } from 'modules/wallet/actions';
import { initialState } from 'modules/wallet/reducer';
import { THistoryEntry } from 'modules/wallet/history';
import Wallet from '.';
import messages from '../../../../../public/locales/en-US.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = { account: '0624-2890-6001-1238-3609', ecosystem: '2' };
// Two digits: the amounts shown are 0.01, 0.02, 0.03
const VALUE = { amount: '1', utxo: '2', total: '3', digits: 2, token_symbol: 'ABC', token_name: 'Abc' };
const entry = (id: string): THistoryEntry => ({ id, time: 1, blockID: '1', hash: '', amount: '1', comment: '', kind: 'transfer', direction: 'in', counterparty: '0000-0000-0000-0000-0005' });

// The wallet page on a store that keeps its state and records what the page dispatches
const renderWallet = async (
    history: IRootState['wallet']['history'],
    utxoHistory: IRootState['wallet']['utxoHistory'] = null,
    wallet: Partial<IRootState['wallet']> = {},
    // '': the network has no block explorer
    explorer = 'https://testscan.ibax.network:8800/api/v2'
) => {
    const state: IRootState = {
        ...mockState,
        auth: {
            ...mockState.auth,
            isDefaultWallet: false,
            session: { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE },
            wallet: {
                wallet: { id: '1', walletID: '1', address: OWNER.account, encKey: '', publicKey: '', access: [] },
                access: { ecosystem: OWNER.ecosystem, name: '', roles: [], notifications: [] }
            }
        },
        storage: { ...mockState.storage, networks: [{ uuid: 'testnet', id: 5, name: 'Testnet', honorNodes: ['http://node'], explorer: explorer || undefined }] },
        wallet: { ...initialState, balance: { ...OWNER, value: VALUE, fee: VALUE }, history, utxoHistory, ...wallet }
    };
    const dispatched: Action[] = [];
    const store = createStore((current: IRootState = state, action: Action) => {
        dispatched.push(action);
        return current;
    });
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => root.render(
        <Provider store={store}>
            <IntlProvider locale="en-US" messages={messages}>
                <Wallet />
            </IntlProvider>
        </Provider>
    ));
    const click = (text: string) => act(() => [...container.querySelectorAll('button')].find(button => button.textContent === text).click());
    const requests = () => dispatched.filter(action => fetchHistory.started.match(action)).map(action => (action as ReturnType<typeof fetchHistory.started>).payload);
    const utxoRequests = () => dispatched.filter(action => fetchUtxoHistory.started.match(action)).map(action => (action as ReturnType<typeof fetchUtxoHistory.started>).payload);
    return { container, dispatched, requests, utxoRequests, click, clear: () => dispatched.splice(0), unmount: () => act(() => root.unmount()) };
};

describe('wallet page history', () => {
    it('loads the balance and the first page of activity when it opens', async () => {
        const page = await renderWallet(null);
        expect(page.dispatched).toContainEqual(fetchBalance.started(OWNER));
        expect(page.requests()).toEqual([{ ...OWNER, filter: 'transfers', before: null }]);
        expect(page.utxoRequests()).toEqual([{ ...OWNER, cursor: null }]);
        await page.unmount();
    });


    it('reloads the history shown with the balance, switches filter, and loads the rows older than the last shown', async () => {
        const page = await renderWallet({ ...OWNER, filter: 'fees', entries: [entry('9'), entry('7')], more: 4 });
        page.clear();

        await page.click('Refresh');
        expect(page.dispatched).toContainEqual(fetchBalance.started(OWNER));
        expect(page.requests()).toEqual([{ ...OWNER, filter: 'fees', before: null }]);
        page.clear();

        await page.click('All');
        expect(page.requests()).toEqual([{ ...OWNER, filter: 'all', before: null }]);
        page.clear();

        await page.click('Show older (4)');
        expect(page.requests()).toEqual([{ ...OWNER, filter: 'fees', before: '7' }]);
        await page.unmount();
    });

    it('does not show another account\'s or ecosystem\'s history', async () => {
        const page = await renderWallet({ ...OWNER, ecosystem: '3', filter: 'fees', entries: [entry('9')], more: 0 });
        expect(page.container.querySelectorAll('.wallet__history-entry')).toHaveLength(0);
        expect(page.container.textContent).toContain('Loading history…');
        // Its filter is not taken over either: this wallet's history starts from the default
        page.clear();
        await page.click('Refresh');
        expect(page.requests()).toEqual([{ ...OWNER, filter: 'transfers', before: null }]);
        expect(page.utxoRequests()).toEqual([{ ...OWNER, cursor: null }]);
        await page.unmount();
    });

    it('reloads the UTXO transfers with the balance, and looks further back from where the last page stopped', async () => {
        const next = { block: 1500, position: 240, skip: 0, after: '' };
        const page = await renderWallet(null, { ...OWNER, entries: [], next, checked: 240, total: 900, incomplete: [] });
        // The explorer's host, which the address is sent to
        expect(page.container.textContent).toContain('address is sent to testscan.ibax.network:8800.');
        page.clear();
        await page.click('Refresh');
        expect(page.utxoRequests()).toEqual([{ ...OWNER, cursor: null }]);
        page.clear();
        await page.click('Look further back');
        expect(page.utxoRequests()).toEqual([{ ...OWNER, cursor: next }]);
        await page.unmount();
    });

    it('tries again the request that failed, as it was', async () => {
        const failedHistory = { ...OWNER, filter: 'fees' as const, before: '7' };
        const failedUtxo = { ...OWNER, cursor: { block: 1500, position: 240, skip: 0, after: '' } };
        const page = await renderWallet(
            { ...OWNER, filter: 'fees', entries: [entry('9'), entry('7')], more: 4 },
            { ...OWNER, entries: [], next: failedUtxo.cursor, checked: 240, total: 900, incomplete: [] },
            { historyError: 'E_OFFLINE', historyRetry: failedHistory, utxoHistoryError: 'E_OFFLINE', utxoHistoryRetry: failedUtxo }
        );
        page.clear();
        const tryAgain = [...page.container.querySelectorAll('button')].filter(button => 'Try again' === button.textContent);
        await act(() => tryAgain[0].click());
        await act(() => tryAgain[1].click());
        expect(page.requests()).toEqual([failedHistory]);
        expect(page.utxoRequests()).toEqual([failedUtxo]);
        await page.unmount();
    });

    it('shows the balance in the token\'s digits', async () => {
        const page = await renderWallet(null);
        expect([...page.container.querySelectorAll('.wallet__amount')].map(amount => amount.textContent)).toEqual(['0.01\u00A0ABC', '0.02\u00A0ABC', '0.03\u00A0ABC']);
        await page.unmount();
    });

    it('says where a UTXO transfer just sent will be listed, or to keep its hash where it cannot be', async () => {
        const lastTransfer = {
            call: { transfer: { type: 'utxo' as const, toID: '5', amount: '100' }, confirm: { title: '', description: '' } },
            result: { hash: 'ab12' }
        };
        const listed = await renderWallet(null, null, { lastTransfer });
        expect(listed.container.querySelector('.alert-success').textContent).toContain('It is listed under UTXO transfers below once the block explorer has indexed it');
        await listed.unmount();
        const unlisted = await renderWallet(null, null, { lastTransfer }, '');
        expect(unlisted.container.querySelector('.alert-success').textContent).toContain('This network has no block explorer to list UTXO transfers: keep the transaction hash.');
        expect(unlisted.container.textContent).toContain('This network has no block explorer configured');
        await unlisted.unmount();
    });
});
