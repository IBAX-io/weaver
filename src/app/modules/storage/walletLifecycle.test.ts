/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { combineReducers } from 'redux';
import rootReducer from 'modules';
import { createWallet } from 'lib/keyring';
import { logout, selectWallet } from 'modules/auth/actions';
import { saveWallet } from './actions';

// The whole store, the way the app runs it: every slice sees every action
const reducer = combineReducers(rootReducer);
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
        // Signed out: the context stays, its wallet is gone
        state = reducer(state, logout.done({ params: null, result: null }));
        expect(state.auth.wallet.wallet).toBeNull();

        state = reducer(state, saveWallet(b));
        expect(state.storage.wallets.map(wallet => wallet.id)).toEqual([a.id, b.id]);
    }, 20000);
});
