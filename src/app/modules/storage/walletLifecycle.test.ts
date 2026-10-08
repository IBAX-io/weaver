/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { combineReducers } from 'redux';
import rootReducer from 'modules';
import { createWallet } from 'lib/keyring';
import { authorize, deauthorize, login, loginGuest, logout, selectWallet } from 'modules/auth/actions';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { saveWallet } from './actions';

// The whole store, the way the app runs it: every slice sees every action
const reducer = combineReducers(rootReducer);
// Test keys only: A is a published test vector, B the same with its last digit changed (any
// 32-byte value below the curve order is a valid key)
const KEY_A = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';
const KEY_B = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b726';

describe('stored wallets across sign-in and sign-out', () => {
    it('keeps every imported wallet when one is imported after signing out', async () => {
        const a = await createWallet(KEY_A, 'password a');
        const b = await createWallet(KEY_B, 'password b');

        let state = reducer(undefined, { type: '@@weaver/INIT' });
        state = reducer(state, saveWallet(a));
        state = reducer(state, selectWallet({
            wallet: { id: '1', walletID: a.id, address: '', encKey: a.encKey, publicKey: '', access: [] },
            access: { ecosystem: '1', name: '', roles: [], notifications: [] }
        }));
        state = reducer(state, logout.done({ params: null, result: null }));
        expect(state.auth.wallet).toBeNull();

        state = reducer(state, saveWallet(b));
        expect(state.storage.wallets.map(wallet => wallet.id)).toEqual([a.id, b.id]);
    }, 20000);

    // Code everywhere reads `auth.wallet && auth.wallet.wallet.address`: a context without its account
    // passes that check and crashes (twice: saving a wallet after signing out, a transfer confirmed
    // after it). The open account is all there or not there, whatever the session goes through.
    it('never leaves half an account open: the context is complete or null', () => {
        const session = { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };
        const context = (id: string, ecosystem: string) => ({
            wallet: { id, walletID: id, address: `000${id}`, encKey: 'enc', publicKey: 'pub', access: [] },
            access: { ecosystem, name: '', roles: [], notifications: [] }
        });
        const steps = [
            loginGuest.done({ params: null, result: { privateKey: 'k', publicKey: 'p', wallet: context('guest', '1'), session } }),
            logout.done({ params: null, result: null }),
            selectWallet(context('a', '1')),
            login.done({ params: { password: 'x' }, result: { session, privateKey: 'k', publicKey: 'p' } }),
            authorize('k'),
            deauthorize(null),
            selectWallet(context('a', '2')),
            logout.done({ params: null, result: null }),
            saveWallet({ id: 'a', encKey: 'new', identities: {} }),
            logout.done({ params: null, result: null }),
            selectWallet(context('b', '1'))
        ];
        let state = reducer(undefined, { type: '@@weaver/INIT' });
        for (const step of steps) {
            state = reducer(state, step);
            const open = state.auth.wallet;
            expect([step.type, null === open || Boolean(open.wallet && open.access)]).toEqual([step.type, true]);
        }
        // Positive control: the run ends with an account open, so the check saw both shapes
        expect(state.auth.wallet.wallet.id).toBe('b');
    });

    it('signs out cleanly when no wallet was ever chosen', () => {
        const state = reducer(reducer(undefined, { type: '@@weaver/INIT' }), logout.done({ params: null, result: null }));
        expect(state.auth.wallet).toBeNull();
        expect(state.auth.isAuthenticated).toBe(false);
    });
});
