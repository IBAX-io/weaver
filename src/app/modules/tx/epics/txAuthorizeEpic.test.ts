/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { Action } from 'redux';
import { runEpicLoop } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import { IModuleKeyRef } from 'ibax/auth';
import { IPkcs11 } from 'ibax/pkcs11';
import { modalClose, modalShow } from 'modules/modal/actions';
import { authorize } from 'modules/auth/actions';
import { enqueueNotification } from 'modules/notifications/actions';
import { moduleKey } from 'lib/crypto/signer';
import { Pkcs11Error } from 'lib/pkcs11';
import { txAuthorize } from '../actions';
import txAuthorizeEpic from './txAuthorizeEpic';

const KEY_REF: IModuleKeyRef = {
    token: { serial: 'S1', label: 'Token' },
    id: '01',
    label: 'Key',
    cryptoer: 'ECC_P256',
    publicKey: '04aa'
};

// Signed in with an account whose key is on a token
const state: IRootState = {
    ...mockState,
    auth: {
        ...mockState.auth,
        isDefaultWallet: false,
        signingKey: null,
        wallet: {
            wallet: { id: '1', walletID: '1', address: '0000-0000-0000-0000-0001', encKey: '', publicKey: '', access: [], module: KEY_REF },
            access: { ecosystem: '1', name: '', roles: [], notifications: [] }
        }
    }
};

const fakeModule = (refusal?: Pkcs11Error) => {
    const login = vi.fn(async () => {
        if (refusal) {
            throw refusal;
        }
    });
    return { pkcs11: { login } as unknown as IPkcs11, login };
};

// Plays the user: enters `pin` when asked
const enterPin = (pin: string) => (action: Action) =>
    modalShow.match(action) && 'TX_AUTHORIZE' === action.payload.id ? [modalClose({ id: 'TX_AUTHORIZE', reason: 'RESULT', data: pin })] : [];

const run = (pin: string, pkcs11: IPkcs11 | null) =>
    runEpicLoop(txAuthorizeEpic, [txAuthorize.started({})], { respond: enterPin(pin), state, dependencies: { pkcs11 } });

describe('txAuthorizeEpic with a module key', () => {
    it('asks for the PIN and logs in to the key\'s token', async () => {
        const { pkcs11, login } = fakeModule();
        const out = await run('1234', pkcs11);

        expect(out.find(modalShow.match).payload).toMatchObject({ type: 'AUTHORIZE', params: { purpose: 'pin' } });
        expect(login).toHaveBeenCalledWith('S1', '1234');
        expect(out).toContainEqual(authorize(moduleKey(KEY_REF)));
        expect(out).toContainEqual(txAuthorize.done({ params: {} }));
    });

    it('leaves the PIN to the token\'s own PIN pad when none is entered', async () => {
        const { pkcs11, login } = fakeModule();
        const out = await run('', pkcs11);

        expect(login).toHaveBeenCalledWith('S1', null);
        expect(out).toContainEqual(txAuthorize.done({ params: {} }));
    });

    it('says a wrong PIN as a wrong password', async () => {
        const out = await run('0000', fakeModule(new Pkcs11Error('E_PKCS11_PIN_INCORRECT', 'CKR_PIN_INCORRECT')).pkcs11);

        expect(out).toContainEqual(txAuthorize.failed({ params: {}, error: null }));
        expect(out.find(enqueueNotification.match).payload.type).toBe('INVALID_PASSWORD');
        expect(out.map(action => action.type)).not.toContain(authorize.type);
    });

    it('names any other refusal of the module', async () => {
        const out = await run('1234', fakeModule(new Pkcs11Error('E_PKCS11_PIN_LOCKED', 'CKR_PIN_LOCKED')).pkcs11);

        expect(out).toContainEqual(txAuthorize.failed({ params: {}, error: null }));
        expect(out).toContainEqual(modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: 'E_PKCS11_PIN_LOCKED' } }));
    });

    it('says the desktop app is needed where no module can be reached', async () => {
        const out = await run('1234', null);

        expect(out).toContainEqual(modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: 'E_PKCS11_UNAVAILABLE' } }));
    });
});
