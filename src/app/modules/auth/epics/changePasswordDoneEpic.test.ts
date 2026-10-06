/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import { createWallet, decryptPrivateKey } from 'lib/keyring';
import { saveWallet } from 'modules/storage/actions';
import { changePassword } from '../actions';
import reducer from '../reducer';
import changePasswordDoneEpic from './changePasswordDoneEpic';

const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';

const signedIn = async (stored: boolean): Promise<IRootState> => {
    const wallet = await createWallet(PRIVATE_KEY, 'old');
    return {
        ...mockState,
        auth: {
            ...mockState.auth,
            wallet: {
                wallet: { id: '1', walletID: wallet.id, address: '', encKey: wallet.encKey, publicKey: '', access: [] },
                access: { ecosystem: '1', name: '', roles: [], notifications: [] }
            }
        },
        storage: { ...mockState.storage, wallets: stored ? [wallet] : [] }
    };
};

const done = changePassword.done({ params: undefined, result: { privateKey: PRIVATE_KEY, newPassword: 'new' } });

describe('changePasswordDoneEpic', () => {
    it('stores the key under the new password, for the signed-in wallet too', async () => {
        const state = await signedIn(true);
        const out = await runEpic(changePasswordDoneEpic, [done], state);
        const saved = out.find(action => saveWallet.match(action)) as ReturnType<typeof saveWallet>;

        expect(await decryptPrivateKey(saved.payload.encKey, 'new')).toBe(PRIVATE_KEY);
        expect(await decryptPrivateKey(saved.payload.encKey, 'old')).toBeNull();
        // The session unlocks with the new password from now on, before signing out
        const auth = reducer(state.auth, saved);
        expect(auth.wallet.wallet.encKey).toBe(saved.payload.encKey);
    }, 20000);

    it('reports an error instead of a change that was stored nowhere', async () => {
        const out = await runEpic(changePasswordDoneEpic, [done], await signedIn(false));
        expect(out.some(action => saveWallet.match(action))).toBe(false);
        expect(out).toContainEqual(changePassword.failed({ params: null, error: 'E_SERVER' }));
    }, 20000);
});
