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
import { fetchBalance, fetchHistory } from 'modules/wallet/actions';
import { initialState } from 'modules/wallet/reducer';
import { THistoryEntry } from 'modules/wallet/history';
import Wallet from '.';
import messages from '../../../../../public/locales/en-US.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OWNER = { account: '0624-2890-6001-1238-3609', ecosystem: '2' };
const VALUE = { amount: '1', utxo: '2', total: '3', digits: 0, token_symbol: 'ABC', token_name: 'Abc' };
const entry = (id: string): THistoryEntry => ({ id, time: 1, blockID: '1', hash: '', amount: '1', comment: '', kind: 'transfer', direction: 'in', counterparty: '0000-0000-0000-0000-0005' });

// The wallet page on a store that keeps its state and records what the page dispatches
const renderWallet = async (history: IRootState['wallet']['history']) => {
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
        wallet: { ...initialState, balance: { ...OWNER, value: VALUE, fee: VALUE }, history }
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
    return { container, dispatched, requests, click, clear: () => dispatched.splice(0), unmount: () => act(() => root.unmount()) };
};

describe('wallet page history', () => {
    it('loads the balance and the first page of activity when it opens', async () => {
        const page = await renderWallet(null);
        expect(page.dispatched).toContainEqual(fetchBalance.started(OWNER));
        expect(page.requests()).toEqual([{ ...OWNER, filter: 'transfers', before: null }]);
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
        await page.unmount();
    });
});
