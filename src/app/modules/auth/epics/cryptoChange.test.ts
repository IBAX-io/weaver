/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// A change of the network's key algorithms found while signing in, and what follows any such
// change: no modal (the sign-out closes modals; the sign-in page says why) and the network
// connected to again, so its accounts are listed under the algorithms it reports now
import { describe, it, expect, vi } from 'vitest';
import { lastValueFrom, of, Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { StateObservable } from 'redux-observable';
import { IRootState } from 'modules';
import storeDependencies from 'modules/dependencies';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { authenticate } from 'services/auth';
import { modalShow } from 'modules/modal/actions';
import { navigate } from 'modules/router/actions';
import { discoverNetwork } from 'modules/engine/actions';
import { txExec } from 'modules/tx/actions';
import { txExecFailedEpic } from 'modules/tx/epics/txExecFailedEpic';
import { acquireSession, cryptoChanged, E_CRYPTO_CHANGED, login, logout } from '../actions';
import loginEpic from './loginEpic';
import authErrorEpic from './authErrorEpic';
import reconnectOnCryptoChangeEpic from './reconnectOnCryptoChangeEpic';

vi.mock('services/auth', () => ({ authenticate: vi.fn() }));
vi.mock('lib/keyring', async importOriginal => ({ ...(await importOriginal<object>()), decryptPrivateKey: vi.fn(async () => 'aa'.repeat(32)) }));

const network = { uuid: 'net', apiHost: 'http://node' };
const account = { id: '7', walletID: '7', address: '0000-0000-0000-0000-0007', encKey: 'v1', publicKey: '04', access: [] };
// The wallet list of the network as last connected to: secp256k1/Keccak-256
const state: IRootState = {
    ...mockState,
    auth: { ...mockState.auth, wallet: { wallet: account, access: { ecosystem: '1', name: '', roles: [], notifications: [] } } },
    engine: { ...mockState.engine, guestSession: { network, sessionToken: '', cryptoSuite: DEFAULT_CRYPTO_SUITE } },
    storage: { ...mockState.storage, networks: [{ uuid: 'net', id: 1, name: 'Net', honorNodes: ['http://node'] }] }
};
const authenticated = (cryptoSuite: typeof DEFAULT_CRYPTO_SUITE) => ({
    result: { token: 't', refresh: '', notify_key: '', timestamp: '0', key_id: '7', ecosystem_id: '1', account: account.address, expiry: 0, isnode: false, isowner: false, roles: [] },
    networkID: 1, cryptoSuite, publicKey: '04', keyID: '7'
});

describe('a change of the network\'s key algorithms', () => {
    it('signs in under the algorithms the account was listed under', async () => {
        vi.mocked(authenticate).mockResolvedValueOnce(authenticated(DEFAULT_CRYPTO_SUITE));
        const out = await runEpic(loginEpic, [login.started({ password: 'p' })], state);
        expect(out.map(action => action.type)).toEqual([navigate.type, login.done.type, acquireSession.started.type]);
    });

    it('found while signing in, sends back to the list instead (the node signed the new address in)', async () => {
        vi.mocked(authenticate).mockResolvedValueOnce(authenticated({ cryptoer: 'SM2', hasher: 'SM3' }));
        const out = await runEpic(loginEpic, [login.started({ password: 'p' })], state);
        expect(out).toEqual([
            login.failed({ params: { password: 'p' }, error: E_CRYPTO_CHANGED }),
            cryptoChanged({ reason: E_CRYPTO_CHANGED, network: 'net', during: 'session' }),
            logout.started(null)
        ]);
    });

    it('compares with the algorithms the account was listed under, though the network reconnects meanwhile', async () => {
        // While the node signs in, the network is connected to again and now reports SM2/SM3
        const states = new Subject<IRootState>();
        const state$ = new StateObservable<IRootState>(states, state);
        const SM2 = { cryptoer: 'SM2', hasher: 'SM3' } as const;
        vi.mocked(authenticate).mockImplementationOnce(async () => {
            states.next({ ...state, engine: { ...state.engine, guestSession: { network, sessionToken: '', cryptoSuite: SM2 } } });
            return authenticated(SM2);
        });
        const out = await lastValueFrom(loginEpic(of(login.started({ password: 'p' })), state$, storeDependencies).pipe(toArray()));
        expect(out[0]).toEqual(login.failed({ params: { password: 'p' }, error: E_CRYPTO_CHANGED }));
    });

    it('shows no modal for it, and one for anything else (positive control)', async () => {
        expect(await runEpic(authErrorEpic, [login.failed({ params: { password: 'p' }, error: E_CRYPTO_CHANGED })])).toEqual([]);
        expect(await runEpic(authErrorEpic, [login.failed({ params: { password: 'p' }, error: 'E_INVALID_PASSWORD' })]))
            .toEqual([modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: 'E_INVALID_PASSWORD' } })]);
        const tx = { uuid: 'tx', contracts: [] };
        const routerService = { routeToBrowser: vi.fn() };
        expect(await runEpic(txExecFailedEpic, [txExec.failed({ params: tx, error: { type: E_CRYPTO_CHANGED, error: '', params: [] } })], mockState, { routerService } as never)).toEqual([]);
        expect(await runEpic(txExecFailedEpic, [txExec.failed({ params: tx, error: { type: 'E_SERVER', error: 'x', params: [] } })], mockState, { routerService } as never))
            .toEqual([modalShow({ id: 'TX_ERROR', type: 'TX_ERROR', params: { type: 'E_SERVER', error: 'x', params: [] } })]);
    });

    it('connects to the network again, a known one', async () => {
        const reason = { reason: E_CRYPTO_CHANGED, network: 'net', during: 'send' } as const;
        expect(await runEpic(reconnectOnCryptoChangeEpic, [cryptoChanged(reason)], state)).toEqual([discoverNetwork.started({ uuid: 'net' })]);
        expect(await runEpic(reconnectOnCryptoChangeEpic, [cryptoChanged({ ...reason, network: 'gone' })], state)).toEqual([]);
    });
});
