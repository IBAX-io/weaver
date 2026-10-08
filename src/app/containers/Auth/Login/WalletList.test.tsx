/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { Action, createStore } from 'redux';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import { createWallet } from 'lib/keyring';
import { ICryptoSuiteId } from 'lib/crypto/suites';
import { formatAddress } from 'lib/crypto/address';
import { enableWalletOnNetwork } from 'modules/auth/actions';
import WalletList from './WalletList';
import en from '../../../../../public/locales/en-US.json';
import zh from '../../../../../public/locales/zh-CN.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SM2: ICryptoSuiteId = { cryptoer: 'SM2', hasher: 'SM3' };
const KEYS = ['e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f', '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727'];

// The login page on a network of the given suite, with one wallet stored before SM2 was supported
// and one stored since
const renderList = async (suite: ICryptoSuiteId, locale = 'en-US', signedOutBecause: IRootState['auth']['signedOutBecause'] = null) => {
    const [old, current] = await Promise.all(KEYS.map(key => createWallet(key, 'password')));
    const before = { ...old, identities: Object.fromEntries(Object.entries(old.identities).filter(([key]) => !key.startsWith('SM2/'))) };
    const state: IRootState = {
        ...mockState,
        auth: { ...mockState.auth, signedOutBecause },
        engine: { ...mockState.engine, guestSession: { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: '', cryptoSuite: suite } },
        storage: { ...mockState.storage, wallets: [before, current], networks: [{ uuid: 'net', id: 1, name: 'Net', honorNodes: ['http://node'] }] }
    };
    const dispatched: Action[] = [];
    const store = createStore((value: IRootState = state, action: Action) => {
        dispatched.push(action);
        return value;
    });
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => root.render(
        <Provider store={store}>
            <MemoryRouter>
                <IntlProvider locale={locale} messages={'zh-CN' === locale ? zh : en}>
                    <WalletList />
                </IntlProvider>
            </MemoryRouter>
        </Provider>
    ));
    return { container, dispatched, before, current, unmount: () => act(() => root.unmount()) };
};

describe('login page on a network of other key algorithms', () => {
    it('lists a wallet stored before the network\'s algorithms were supported, to be set up with its password', async () => {
        const view = await renderList(SM2);
        const section = view.container.querySelector('section[aria-labelledby="enable-wallets-title"]');
        expect(section.querySelector('h2').textContent).toBe('Accounts not set up for this network yet');
        const buttons = [...section.querySelectorAll('button')];
        // Only the one without the identity, shown by its address on mainnet and testnet
        expect(buttons).toHaveLength(1);
        expect(buttons[0].textContent).toContain('Set up account for this network');
        expect(buttons[0].textContent).toContain(formatAddress(view.before.id));
        await act(() => buttons[0].click());
        expect(view.dispatched).toContainEqual(enableWalletOnNetwork.started(view.before));
        // The one stored since is listed as usable (a placeholder until the node's details load)
        expect(view.container.textContent.split('Unregistered account')).toHaveLength(2);
        await view.unmount();
    });

    it('shows no such section where every wallet is set up', async () => {
        const view = await renderList({ cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' });
        expect(view.container.querySelector('section[aria-labelledby="enable-wallets-title"]')).toBeNull();
        await view.unmount();
    });

    it('reads in Chinese', async () => {
        const view = await renderList(SM2, 'zh-CN');
        expect(view.container.querySelector('#enable-wallets-title').textContent).toBe('尚未在此网络启用的账户');
        await view.unmount();
    });

    it('says why the user was signed out, when the network\'s algorithms changed', async () => {
        const view = await renderList(SM2, 'en-US', 'E_CRYPTO_CHANGED');
        expect(view.container.querySelector('.alert-warning[role="status"]').textContent)
            .toBe('This network now uses other key algorithms, so your account has another address on it. Please sign in again.');
        await view.unmount();
        const none = await renderList(SM2);
        expect(none.container.querySelector('.alert-warning')).toBeNull();
        await none.unmount();
    });
});
