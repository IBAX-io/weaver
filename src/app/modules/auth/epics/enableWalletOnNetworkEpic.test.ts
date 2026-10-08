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
import { enableWalletOnNetwork } from '../actions';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import { formatAddress } from 'lib/crypto/address';
import { enqueueNotification } from 'modules/notifications/actions';
import enableWalletOnNetworkEpic, { ENABLE_WALLET_MODAL } from './enableWalletOnNetworkEpic';

const PRIVATE_KEY = 'e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f';
const PASSWORD = 'correct horse';
const SM2 = { cryptoer: 'SM2', hasher: 'SM3' } as const;
// On an SM2/SM3 network
const state: IRootState = { ...mockState, engine: { ...mockState.engine, guestSession: { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: '', cryptoSuite: SM2 } } };

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
        const out = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet)], { respond: answer(PASSWORD), state, until: action => enableWalletOnNetwork.done.match(action) || enableWalletOnNetwork.failed.match(action) });
        const saved = out.find(action => saveWallet.match(action)) as ReturnType<typeof saveWallet>;

        // The node's SM2/SM3 key and account id, the rest kept, the key stored as it was
        const suite = resolveCryptoSuite(SM2);
        const publicKey = suite.publicKey(PRIVATE_KEY);
        expect(saved.payload.identities[cryptoSuiteKey(SM2)]).toEqual({ publicKey, keyID: suite.keyID(publicKey) });
        expect(saved.payload.identities).toEqual(expect.objectContaining(wallet.identities));
        expect(saved.payload.id).toBe(wallet.id);
        expect(saved.payload.encKey).toBe(wallet.encKey);
        expect(await decryptPrivateKey(saved.payload.encKey, PASSWORD)).toBe(PRIVATE_KEY);
        // Saving it lists it (loadSavedWalletEpic); its address there is said
        const notified = out.find(action => enqueueNotification.match(action)) as ReturnType<typeof enqueueNotification>;
        expect(notified.payload).toMatchObject({ type: 'WALLET_ENABLED', params: { address: formatAddress(suite.keyID(publicKey)) } });
        // The password prompt keeps its result out of the state, and says why it is asked
        expect(out).toContainEqual(expect.objectContaining({
            type: modalShow.type,
            payload: expect.objectContaining({ secret: true, params: { purpose: 'network' } })
        }));
    }, 20000);

    it('says a stored key it cannot read, and asks one password at a time', async () => {
        const wallet = { ...(await storedBeforeSM2()), encKey: 'damaged' };
        const out = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet)], { respond: answer(PASSWORD), state });
        expect(out).toContainEqual(enableWalletOnNetwork.failed({ params: wallet, error: 'E_SERVER' }));
        expect(out).toContainEqual(expect.objectContaining({ type: modalShow.type, payload: expect.objectContaining({ id: 'AUTH_ERROR', params: { error: 'E_INVALID_KEY' } }) }));
        // A second request while the prompt is open is not a second prompt
        const twice = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet), enableWalletOnNetwork.started(wallet)], { state });
        expect(twice.filter(action => modalShow.match(action))).toHaveLength(1);
    });

    it('says a key outside the network\'s curve has no address there, and saves nothing', async () => {
        // SM2's group order: a key secp256k1 and P-256 take, SM2 does not
        const key = 'fffffffeffffffffffffffffffffffff7203df6b21c6052b53bbf40939d54123';
        const created = await createWallet(key, PASSWORD);
        const wallet = { ...created, identities: Object.fromEntries(Object.entries(created.identities).filter(([suite]) => !suite.startsWith('SM2/'))) };
        const out = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet)], { respond: answer(PASSWORD), state, until: action => enableWalletOnNetwork.failed.match(action) });
        expect(out).toContainEqual(expect.objectContaining({ type: modalShow.type, payload: expect.objectContaining({ id: 'AUTH_ERROR', params: { error: 'E_KEY_NOT_USABLE' } }) }));
        expect(out.some(action => saveWallet.match(action) || enableWalletOnNetwork.done.match(action))).toBe(false);
    }, 20000);

    it('changes nothing when the password is wrong or the prompt is cancelled', async () => {
        const wallet = await storedBeforeSM2();
        for (const [password, error] of [[PASSWORD + 'x', 'E_INVALID_PASSWORD'], [null, 'E_CANCELLED']] as const) {
            const out = await runEpicLoop(enableWalletOnNetworkEpic, [enableWalletOnNetwork.started(wallet)], { respond: answer(password), until: action => enableWalletOnNetwork.failed.match(action) });
            expect(out.some(action => saveWallet.match(action))).toBe(false);
            expect(out).toContainEqual(enableWalletOnNetwork.failed({ params: wallet, error }));
        }
    }, 20000);
});
