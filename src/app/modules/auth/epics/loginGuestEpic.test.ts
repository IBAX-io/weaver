/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { ILoginResponse } from 'ibax/api';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { DEFAULT_CRYPTO_SUITE, UnsupportedCryptoSuiteError } from 'lib/crypto/suites';
import { authenticate } from 'services/auth';
import { acquireSession, loginGuest } from '../actions';
import { navigate } from 'modules/router/actions';
import loginGuestEpic from './loginGuestEpic';

vi.mock('services/auth', () => ({ authenticate: vi.fn() }));

const guestNetwork = { uuid: 'testnet', apiHost: 'http://node' };
const state: IRootState = {
    ...mockState,
    engine: { ...mockState.engine, guestSession: { network: guestNetwork, sessionToken: '', cryptoSuite: DEFAULT_CRYPTO_SUITE } }
};
const loginResponse: ILoginResponse = {
    token: 'guest-token',
    refresh: '',
    notify_key: '',
    timestamp: '0',
    key_id: '123',
    ecosystem_id: '1',
    account: '0000-0000',
    expiry: 0,
    isnode: false,
    isowner: false,
    roles: []
};

describe('loginGuestEpic', () => {
    it('acquires the guest session so the app leaves the splash screen', async () => {
        vi.mocked(authenticate).mockResolvedValueOnce({
            result: loginResponse,
            networkID: 1,
            cryptoSuite: DEFAULT_CRYPTO_SUITE,
            publicKey: '04ab',
            keyID: '123'
        });

        const output = await runEpic(loginGuestEpic, [loginGuest.started()], state);
        const session = { sessionToken: 'guest-token', network: guestNetwork, cryptoSuite: DEFAULT_CRYPTO_SUITE };

        expect(output.map(a => a.type)).toEqual([navigate({ to: '/' }).type, loginGuest.done.type, acquireSession.started.type]);
        expect(output[2]).toEqual(acquireSession.started(session));
    }, 20000);

    it('reports networks with an unsupported signature suite', async () => {
        vi.mocked(authenticate).mockRejectedValueOnce(new UnsupportedCryptoSuiteError({ cryptoer: 'ECC_P512', hasher: 'SHA256' }));

        const output = await runEpic(loginGuestEpic, [loginGuest.started()], state);

        expect(output).toEqual([loginGuest.failed({ params: undefined, error: 'E_UNSUPPORTED_CRYPTO' })]);
    }, 20000);
});
