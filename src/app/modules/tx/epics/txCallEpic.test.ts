/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { beforeAll, describe, it, expect, vi } from 'vitest';
import { Action } from 'redux';
import { combineEpics } from 'redux-observable';
import { runEpicLoop } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import { modalClose, modalShow } from 'modules/modal/actions';
import { fetchBalance, sendTransfer } from 'modules/wallet/actions';
import sendTransferEpic from 'modules/wallet/epics/sendTransferEpic';
import modalOverlapEpic from 'modules/modal/epics/modalOverlapEpic';
import { txAuthorize, txCall, txExec } from '../actions';
import txCallEpic from './txCallEpic';
import txAuthorizeEpic from './txAuthorizeEpic';
import { ITransactionCall } from 'ibax/tx';
import * as keyring from 'lib/keyring';
import { encryptPrivateKey } from 'lib/keyring';
import { authorize } from 'modules/auth/actions';
import { enqueueNotification } from 'modules/notifications/actions';
import { softwareKey } from 'lib/crypto/signer';

const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';
const CALL: ITransactionCall = { uuid: 'tx-1', contracts: [{ name: 'Test', params: [{}] }] };

// A real encrypted key, so a wrong password is told apart from a corrupt key
let encKey: string;
beforeAll(async () => {
    encKey = await encryptPrivateKey(PRIVATE_KEY, 'right');
}, 20000);

const signedIn = (overrides: Partial<IRootState['auth']>): IRootState => ({
    ...mockState,
    auth: {
        ...mockState.auth,
        isDefaultWallet: false,
        wallet: {
            wallet: { id: '1', walletID: '1', address: '0624-2890-6001-1238-3609', encKey, publicKey: '', access: [] },
            access: { ecosystem: '1', name: '', roles: [], notifications: [] }
        },
        ...overrides
    }
});

const types = (actions: Action[]) => actions.map(action => action.type);
// Plays the user: answers the password prompt
const answerPassword = (reason: 'CANCEL' | 'RESULT', data: string = null) => (action: Action) =>
    modalShow.match(action) && action.payload.id === 'TX_AUTHORIZE' ? [modalClose({ id: 'TX_AUTHORIZE', reason, data })] : [];

describe('txCallEpic', () => {
    it('signs right away when the key is unlocked', async () => {
        const out = await runEpicLoop(txCallEpic, [txCall(CALL)], { state: signedIn({ signingKey: softwareKey(PRIVATE_KEY) }) });
        expect(types(out)).toEqual([txCall.type, txExec.started.type]);
    });

    it('never signs with the public demo key, whoever asks', async () => {
        const out = await runEpicLoop(txCallEpic, [txCall(CALL)], { state: signedIn({ isDefaultWallet: true, signingKey: softwareKey(PRIVATE_KEY) }) });
        expect(out).toContainEqual(txExec.failed({ params: CALL, error: { type: 'E_GUEST_VIOLATION', error: '' } }));
        expect(types(out)).not.toContain(txExec.started.type);
    });

    it('ends the call when the password prompt is cancelled', async () => {
        const epic = combineEpics(txCallEpic, txAuthorizeEpic);
        const out = await runEpicLoop(epic, [txCall(CALL)], { respond: answerPassword('CANCEL'), state: signedIn({ signingKey: null }) });
        expect(types(out)).toEqual([txCall.type, txAuthorize.started.type, modalShow.type, modalClose.type, txAuthorize.failed.type, txExec.failed.type]);
        expect(out[out.length - 1]).toEqual(txExec.failed({ params: CALL, error: { type: 'E_AUTH_CANCELLED', error: '' } }));
    });

    it('ends the call when the password is wrong', async () => {
        const epic = combineEpics(txCallEpic, txAuthorizeEpic);
        // A wrong password is only known after the full key derivation
        const out = await runEpicLoop(epic, [txCall(CALL)], { respond: answerPassword('RESULT', 'wrong'), state: signedIn({ signingKey: null }), quietMs: 3000 });
        expect(types(out)).toContain(txAuthorize.failed.type);
        expect(out).toContainEqual(expect.objectContaining({ type: enqueueNotification.type, payload: expect.objectContaining({ type: 'INVALID_PASSWORD' }) }));
        expect(out).toContainEqual(txExec.failed({ params: CALL, error: { type: 'E_AUTH_CANCELLED', error: '' } }));
    });

    it('says the stored key is corrupt rather than the password wrong', async () => {
        const epic = combineEpics(txCallEpic, txAuthorizeEpic);
        const state = signedIn({ signingKey: null });
        state.auth.wallet.wallet.encKey = 'v1.1.AA.AA.AA';
        const out = await runEpicLoop(epic, [txCall(CALL)], { respond: answerPassword('RESULT', 'right'), state });
        expect(out).toContainEqual(modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: 'E_INVALID_KEY' } }));
        expect(out).toContainEqual(txExec.failed({ params: CALL, error: { type: 'E_AUTH_CANCELLED', error: '' } }));
    });

    it('unlocks the key with the right password, and keeps the password out of the result', async () => {
        const epic = combineEpics(txCallEpic, txAuthorizeEpic);
        const out = await runEpicLoop(epic, [txCall(CALL)], { respond: answerPassword('RESULT', 'right'), state: signedIn({ signingKey: null }), quietMs: 3000 });
        expect(out).toContainEqual(authorize(softwareKey(PRIVATE_KEY)));
        expect(out).toContainEqual(txAuthorize.done({ params: {} }));
        expect(types(out)).toContain(txExec.started.type);
    });

    it('does not take another modal\'s answer as the password', async () => {
        const epic = combineEpics(txCallEpic, txAuthorizeEpic);
        const other = (action: Action) => modalShow.match(action) ? [modalClose({ id: 'SOMETHING_ELSE', reason: 'RESULT', data: 'not a password' })] : [];
        const decrypt = vi.spyOn(keyring, 'decryptPrivateKey');
        const out = await runEpicLoop(epic, [txCall(CALL)], { respond: other, state: signedIn({ signingKey: null }) });
        // Still waiting for the password: the other answer was never tried as one
        expect(decrypt).not.toHaveBeenCalled();
        expect(types(out)).not.toContain(txAuthorize.failed.type);
        expect(types(out)).not.toContain(txAuthorize.done.type);
        decrypt.mockRestore();
    });

    it('says why nothing happened when another dialog replaced the password prompt', async () => {
        const epic = combineEpics(txCallEpic, txAuthorizeEpic);
        const replaced = (action: Action) => modalShow.match(action) && action.payload.id === 'TX_AUTHORIZE' ? [modalClose({ id: 'TX_AUTHORIZE', reason: 'OVERLAP', data: null })] : [];
        const out = await runEpicLoop(epic, [txCall(CALL)], { respond: replaced, state: signedIn({ signingKey: null }) });
        expect(out).toContainEqual(expect.objectContaining({ type: enqueueNotification.type, payload: expect.objectContaining({ type: 'TX_INTERRUPTED' }) }));
        expect(types(out)).not.toContain(txExec.started.type);

        // Cancelled by the user: no message
        const cancelled = await runEpicLoop(epic, [txCall(CALL)], { respond: answerPassword('CANCEL'), state: signedIn({ signingKey: null }) });
        expect(cancelled.some(action => enqueueNotification.match(action))).toBe(false);
    });

    it('lets the wallet page recover after a cancelled password prompt', async () => {
        const epic = combineEpics(sendTransferEpic, txCallEpic, txAuthorizeEpic);
        const call = {
            transfer: { type: 'utxo' as const, toID: '597920150864192934', amount: '1' },
            confirm: { title: 'Send?' }
        };
        const user = (action: Action) => modalShow.match(action) && action.payload.id === 'WALLET_TRANSFER_CONFIRM'
            ? [modalClose({ id: 'WALLET_TRANSFER_CONFIRM', reason: 'RESULT', data: true })]
            : answerPassword('CANCEL')(action);
        const out = await runEpicLoop(epic, [sendTransfer.started(call)], { respond: user, state: signedIn({ signingKey: null }) });
        expect(types(out)).toContain(sendTransfer.failed.type);
        expect(types(out)).not.toContain(fetchBalance.started.type);
    });
});

describe('modals', () => {
    it('tells whoever waits for a modal that another one replaced it', async () => {
        const out = await runEpicLoop(modalOverlapEpic, [
            modalShow({ id: 'A', type: 'T', params: {} }),
            modalShow({ id: 'B', type: 'T', params: {} })
        ]);
        expect(out).toContainEqual(modalClose({ id: 'A', reason: 'OVERLAP', data: null }));
        expect(out.filter(action => modalClose.match(action))).toHaveLength(1);
    });
});
