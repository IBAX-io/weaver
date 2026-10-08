/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { Action } from 'redux';
import { runEpicLoop } from 'test/runEpic';
import mockState from 'test/mockStore';
import { createWallet } from 'lib/keyring';
import { modalClose, modalShow } from 'modules/modal/actions';
import { removeLegacyWallet, saveWallet } from 'modules/storage/actions';
import { decryptPrivateKey } from 'lib/keyring';
import fixture from 'lib/crypto/fixtures/cryptojs-legacy-wallets.json';
import { upgradeLegacyWallet } from '../actions';
import upgradeLegacyWalletEpic, { UPGRADE_LEGACY_WALLET_MODAL } from './upgradeLegacyWalletEpic';

const vector = fixture.vectors[0];
const legacy = { id: '42', encKey: vector.encKey, publicKey: vector.publicKey };
const answer = (password: string | null) => (action: Action) => modalShow.match(action)
    ? [modalClose({ id: UPGRADE_LEGACY_WALLET_MODAL, reason: password === null ? 'CANCEL' : 'RESULT', data: password })]
    : [];

describe('upgradeLegacyWalletEpic', () => {
    it('stores the old key the current way, then forgets the old entry', async () => {
        const out = await runEpicLoop(upgradeLegacyWalletEpic, [upgradeLegacyWallet.started(legacy)], { respond: answer(vector.password), until: action => upgradeLegacyWallet.done.match(action) || upgradeLegacyWallet.failed.match(action) });
        const saved = out.find(action => saveWallet.match(action)) as ReturnType<typeof saveWallet>;

        expect(saved).toBeDefined();
        expect(await decryptPrivateKey(saved.payload.encKey, vector.password)).toBe(vector.privateKey);
        const types = out.map(action => action.type);
        expect(types.indexOf(removeLegacyWallet.type)).toBeGreaterThan(types.indexOf(saveWallet.type));
        expect(out).toContainEqual(removeLegacyWallet(legacy.encKey));
        // The password prompt keeps its result out of the state
        expect(out).toContainEqual(expect.objectContaining({ type: modalShow.type, payload: expect.objectContaining({ secret: true }) }));
    }, 20000);

    it('keeps the old entry when the password is wrong or the prompt is cancelled', async () => {
        for (const password of [vector.password + 'x', null]) {
            const out = await runEpicLoop(upgradeLegacyWalletEpic, [upgradeLegacyWallet.started(legacy)], { respond: answer(password) });
            expect(out.some(action => removeLegacyWallet.match(action) || saveWallet.match(action))).toBe(false);
            expect(out.some(action => upgradeLegacyWallet.failed.match(action))).toBe(true);
        }
    });

    it('keeps a wallet of the same key stored since, and its password', async () => {
        const existing = await createWallet(vector.privateKey, 'a newer password');
        const state = { ...mockState, storage: { ...mockState.storage, wallets: [existing] } };
        const out = await runEpicLoop(upgradeLegacyWalletEpic, [upgradeLegacyWallet.started(legacy)], { respond: answer(vector.password), state, until: action => upgradeLegacyWallet.done.match(action) || upgradeLegacyWallet.failed.match(action) });

        expect(out.some(action => saveWallet.match(action))).toBe(false);
        expect(out).toContainEqual(removeLegacyWallet(legacy.encKey));
        expect(out).toContainEqual(upgradeLegacyWallet.done({ params: legacy, result: existing }));
    }, 20000);
});
