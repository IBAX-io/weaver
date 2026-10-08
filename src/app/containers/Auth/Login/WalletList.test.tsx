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

// The login page on a network of the given suite (offline: none), with one wallet stored before
// SM2 was supported and, unless `onlyOld`, one stored since
interface IView { suite?: ICryptoSuiteId | null, locale?: string, signedOutBecause?: IRootState['auth']['signedOutBecause'], onlyOld?: boolean }
const renderList = async ({ suite = SM2, locale = 'en-US', signedOutBecause = null, onlyOld = false }: IView = {}) => {
    const [old, currentWallet] = await Promise.all(KEYS.map(key => createWallet(key, 'password')));
    const before = { ...old, identities: Object.fromEntries(Object.entries(old.identities).filter(([key]) => !key.startsWith('SM2/'))) };
    const state: IRootState = {
        ...mockState,
        auth: { ...mockState.auth, signedOutBecause },
        engine: { ...mockState.engine, guestSession: suite ? { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: '', cryptoSuite: suite } : null },
        storage: { ...mockState.storage, wallets: onlyOld ? [before] : [before, currentWallet], networks: [{ uuid: 'net', id: 1, name: 'Net', honorNodes: ['http://node'] }] }
    };
    const dispatched: Action[] = [];
    let current = state;
    const store = createStore((value: IRootState = state, action: Action) => {
        dispatched.push(action);
        return current;
    });
    // The store's wallets replaced, as when one is saved
    const setWallets = (wallets: IRootState['storage']['wallets']) => act(() => {
        current = { ...current, storage: { ...current.storage, wallets } };
        store.dispatch({ type: 'test/STATE' });
    });
    // The accounts saved by an earlier version replaced, as when one is upgraded
    const setLegacy = (legacyWallets: IRootState['storage']['legacyWallets']) => act(() => {
        current = { ...current, storage: { ...current.storage, legacyWallets } };
        store.dispatch({ type: 'test/STATE' });
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
    const enableSection = () => container.querySelector('section[aria-labelledby="enable-wallets-title"]');
    // Accounts listed as usable on this network
    const usable = () => container.querySelectorAll('.wallet-name').length;
    return { container, dispatched, before, current: currentWallet, enableSection, usable, setWallets, setLegacy, unmount: () => act(() => root.unmount()) };
};

const CHANGED = { reason: 'E_CRYPTO_CHANGED', network: 'net' } as const;

describe('login page on a network of other key algorithms', () => {
    it('lists a wallet stored before the network\'s algorithms were supported, to be set up with its password', async () => {
        const view = await renderList();
        const section = view.enableSection();
        expect(section.querySelector('h2').textContent).toBe('Accounts not set up for this network yet');
        const buttons = [...section.querySelectorAll('button')];
        // Only the one without the identity, shown by its address under the default algorithms
        expect(buttons).toHaveLength(1);
        expect(buttons[0].textContent).toContain('Set up account for this network');
        expect(buttons[0].textContent).toContain(`Its address under the default key algorithms: ${formatAddress(view.before.id)}`);
        await act(() => buttons[0].click());
        expect(view.dispatched).toContainEqual(enableWalletOnNetwork.started(view.before));
        // The one stored since is listed as usable
        expect(view.usable()).toBe(1);
        await view.unmount();
    });

    it('does not welcome as new one whose accounts all wait to be set up', async () => {
        const view = await renderList({ onlyOld: true });
        expect(view.usable()).toBe(0);
        expect(view.enableSection()).not.toBeNull();
        expect(view.container.textContent).toContain('Your accounts are still here.');
        expect(view.container.textContent).not.toContain('Welcome');
        await view.unmount();
    });

    it('shows no such section where every wallet is set up, offline, or where no password would help', async () => {
        for (const suite of [{ cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' }, null, { cryptoer: 'ECC_P512', hasher: 'SHA256' }] as (ICryptoSuiteId | null)[]) {
            const view = await renderList({ suite });
            expect([suite, view.enableSection()]).toEqual([suite, null]);
            await view.unmount();
        }
    });

    it('reads in Chinese', async () => {
        const view = await renderList({ locale: 'zh-CN', signedOutBecause: { ...CHANGED, during: 'session' } });
        expect(view.container.querySelector('#enable-wallets-title').textContent).toBe('尚未在此网络启用的账户');
        expect(view.container.querySelector('[role="alert"]').textContent).toContain('这个网络已改用其他密钥算法');
        await view.unmount();
    });

    it('says why the user was signed out of this network, read out, and how', async () => {
        const session = await renderList({ signedOutBecause: { ...CHANGED, during: 'session' } });
        expect(session.container.querySelector('.alert-warning[role="alert"]').textContent)
            .toBe('You were signed out: this network now uses other key algorithms, so your account has another address on it. Sign in again, after setting the account up below if it is listed there.');
        await session.unmount();
        const send = await renderList({ signedOutBecause: { ...CHANGED, during: 'send' } });
        expect(send.container.querySelector('[role="alert"]').textContent).toContain('those not sent yet were cancelled');
        await send.unmount();
        // Not on another network, nor when there is no reason
        for (const signedOutBecause of [{ ...CHANGED, network: 'other', during: 'session' } as const, null]) {
            const view = await renderList({ signedOutBecause });
            expect(view.container.querySelector('.alert-warning')).toBeNull();
            await view.unmount();
        }
    });

    it('keeps the focus in the list when an account set up leaves it', async () => {
        const [third] = await Promise.all([createWallet('aa'.repeat(32), 'password')]);
        const withoutSM2 = (wallet: typeof third) => ({ ...wallet, identities: Object.fromEntries(Object.entries(wallet.identities).filter(([key]) => !key.startsWith('SM2/'))) });
        const view = await renderList({ onlyOld: true });
        document.body.appendChild(view.container);
        // Two waiting; the first is set up while its button has the focus
        await view.setWallets([view.before, withoutSM2(third)]);
        const leaving = [...view.enableSection().querySelectorAll('button')].find(button => button.textContent.includes(formatAddress(view.before.id)));
        leaving.focus();
        expect(document.activeElement).toBe(leaving);
        await view.setWallets([withoutSM2(third), { ...view.before, identities: (await createWallet(KEYS[0], 'password')).identities }]);
        expect(document.activeElement).toBe(view.container.querySelector('#enable-wallets-title'));
        // A button that stays keeps the focus
        const staying = view.enableSection().querySelector('button');
        staying.focus();
        await view.setWallets([withoutSM2(third), { ...view.before, identities: (await createWallet(KEYS[0], 'password')).identities }]);
        expect(document.activeElement).toBe(staying);
        // The last one: the list goes, the focus to the first button of the page
        await view.setWallets([third, { ...view.before, identities: (await createWallet(KEYS[0], 'password')).identities }]);
        expect(view.enableSection()).toBeNull();
        expect(document.activeElement).toBe(view.container.querySelector('button'));
        view.container.remove();
        await view.unmount();
    });

    it('lists an account whose key the network\'s curve does not take neither as usable nor to set up', async () => {
        const outside = await createWallet('fffffffeffffffffffffffffffffffff7203df6b21c6052b53bbf40939d54123', 'password');
        expect(outside.identities['SM2/SM3']).toBeNull();
        const view = await renderList({ onlyOld: true });
        const usableBefore = view.usable();
        await view.setWallets([view.before, outside]);
        expect(view.usable()).toBe(usableBefore);
        expect(view.enableSection().querySelectorAll('button')).toHaveLength(1);
        await view.unmount();
    });

    it('keeps the focus in the list when an account upgraded leaves it', async () => {
        const legacy = (id: string) => ({ id, encKey: `U2FsdGVkX1${id}` });
        const view = await renderList();
        document.body.appendChild(view.container);
        await view.setLegacy([legacy('1'), legacy('2')]);
        const legacySection = () => view.container.querySelector('section[aria-labelledby="legacy-wallets-title"]');
        legacySection().querySelector('button').focus();
        // Upgraded: its button goes, the focus to the list's heading
        await view.setLegacy([legacy('2')]);
        expect(document.activeElement).toBe(view.container.querySelector('#legacy-wallets-title'));
        // The last one: the list goes, the focus to the first button of the page
        legacySection().querySelector('button').focus();
        await view.setLegacy([]);
        expect(legacySection()).toBeNull();
        expect(document.activeElement).toBe(view.container.querySelector('button'));
        view.container.remove();
        await view.unmount();
    });
});
