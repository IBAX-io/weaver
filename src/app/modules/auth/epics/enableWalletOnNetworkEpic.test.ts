/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { Action } from 'redux';
import { runEpicLoop } from 'test/runEpic';
import { createWallet, decryptPrivateKey } from 'lib/keyring';
import { cryptoSuiteKey, resolveCryptoSuite } from 'lib/crypto/suites';
import { modalClose, modalShow } from 'modules/modal/actions';
import { saveWallet } from 'modules/storage/actions';
import { enableWalletOnNetwork, loadWallets } from '../actions';
import enableWalletOnNetworkEpic, { ENABLE_WALLET_MODAL } from './enableWalletOnNetworkEpic';

const PRIVATE_KEY = 'e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f';
const PASSWORD = 'correct horse';
const SM2 = { cryptoer: 'SM2', hasher: 'SM3' } as const;

const answer = (password: string | null) => (action: Action) => modalShow.match(action)
    ? [modalClose({ id: ENABLE_WALLET_MODAL, reason: password === null ? 'CANCEL' : 'RESULT', data: password })]
    : [];

// A wallet as an earlier version stored it: without the SM2 suites' identities
const storedBeforeSM2 = async () => {
    const wallet = await createWallet(PRIVATE_KEY, PASSWORD);
    const identities = Object.fromEntries(Object.entries(wallet.identities).filter(([key]) => !key.startsWith('SM2/')));
    return { ...wallet, identities };
};

describe('enableWalletOnNetworkEpic', () => {
    it('adds the identities the wallet lacks, with its password, and lists it again', async () => {
        const wallet = await storedBeforeSM2();
        expect(wallet.identities[cryptoSuiteKey(SM2)]).toBeUndefined();
        const out = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet)], { respond: answer(PASSWORD), quietMs: 3000 });
        const saved = out.find(action => saveWallet.match(action)) as ReturnType<typeof saveWallet>;

        // The node's SM2/SM3 key and account id, the rest kept, the key stored as it was
        const suite = resolveCryptoSuite(SM2);
        const publicKey = suite.publicKey(PRIVATE_KEY);
        expect(saved.payload.identities[cryptoSuiteKey(SM2)]).toEqual({ publicKey, keyID: suite.keyID(publicKey) });
        expect(saved.payload.identities).toEqual(expect.objectContaining(wallet.identities));
        expect(saved.payload.id).toBe(wallet.id);
        expect(saved.payload.encKey).toBe(wallet.encKey);
        expect(await decryptPrivateKey(saved.payload.encKey, PASSWORD)).toBe(PRIVATE_KEY);
        const types = out.map(action => action.type);
        expect(types.indexOf(loadWallets.started.type)).toBeGreaterThan(types.indexOf(saveWallet.type));
        // The password prompt keeps its result out of the state, and says why it is asked
        expect(out).toContainEqual(expect.objectContaining({
            type: modalShow.type,
            payload: expect.objectContaining({ secret: true, params: { purpose: 'network' } })
        }));
    }, 20000);

    it('changes nothing when the password is wrong or the prompt is cancelled', async () => {
        const wallet = await storedBeforeSM2();
        for (const [password, error] of [[PASSWORD + 'x', 'E_INVALID_PASSWORD'], [null, 'E_CANCELLED']] as const) {
            const out = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet)], { respond: answer(password), quietMs: 3000 });
            expect(out.some(action => saveWallet.match(action))).toBe(false);
            expect(out).toContainEqual(enableWalletOnNetwork.failed({ params: wallet, error }));
        }
    }, 20000);
});
