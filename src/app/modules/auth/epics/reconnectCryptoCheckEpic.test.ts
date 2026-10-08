/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { lastValueFrom, of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { cryptoSuiteFromNode, DEFAULT_CRYPTO_SUITE, ICryptoSuiteId } from 'lib/crypto/suites';
import IbaxAPI from 'lib/ibaxAPI';
import { reconnected } from 'modules/socket/actions';
import { cryptoChanged, E_CRYPTO_CHANGED, logout } from '../actions';
import reconnectCryptoCheckEpic from './reconnectCryptoCheckEpic';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };
const signedIn = (current: Partial<ISession> | null, isAuthenticated = true): IRootState =>
    ({ ...mockState, auth: { ...mockState.auth, isAuthenticated, session: current } } as IRootState);

// The node after the reconnect: the suite /getuid reports, or no answer (null)
const node = (suite: ICryptoSuiteId | null) => {
    const client = {
        getUid: vi.fn(async () => {
            if (!suite) {
                throw { error: 'E_OFFLINE', msg: '' };
            }
            return { token: '', networkID: 1, uid: 'LOGIN11', cryptoSuite: cryptoSuiteFromNode(suite.cryptoer, suite.hasher) };
        })
    };
    return { client, api: (() => client) as unknown as (params: unknown) => IbaxAPI };
};

describe('reconnectCryptoCheckEpic', () => {
    it('signs out when the network uses other key algorithms after the connection came back', async () => {
        const { client, api } = node({ cryptoer: 'SM2', hasher: 'SM3' });
        const out = await runEpic(reconnectCryptoCheckEpic, [reconnected()], signedIn(session), { api });
        expect(out).toEqual([cryptoChanged({ reason: E_CRYPTO_CHANGED, network: 'net', during: 'session' }), logout.started(null)]);
        expect(client.getUid).toHaveBeenCalledTimes(1);
    });

    it('keeps the session when the algorithms are the same', async () => {
        const { api } = node(DEFAULT_CRYPTO_SUITE);
        expect(await runEpic(reconnectCryptoCheckEpic, [reconnected()], signedIn(session), { api })).toEqual([]);
    });

    it('keeps the session when the node does not answer', async () => {
        const { client, api } = node(null);
        expect(await runEpic(reconnectCryptoCheckEpic, [reconnected()], signedIn(session), { api })).toEqual([]);
        expect(client.getUid).toHaveBeenCalledTimes(1);
    });

    it('leaves a session signed out of while the node was asked alone', async () => {
        const state$ = { value: signedIn(session) };
        const client = {
            getUid: vi.fn(async () => {
                // Signed out before the answer came
                state$.value = signedIn(null, false);
                return { token: '', networkID: 1, uid: 'LOGIN11', cryptoSuite: cryptoSuiteFromNode('SM2', 'SM3') };
            })
        };
        const api = (() => client) as unknown as (params: unknown) => IbaxAPI;
        const out = await lastValueFrom(reconnectCryptoCheckEpic(of(reconnected()), state$ as never, { api } as never).pipe(toArray()));
        expect(out).toEqual([]);
        expect(client.getUid).toHaveBeenCalledTimes(1);
    });

    it('asks nothing when nobody is signed in', async () => {
        const { client, api } = node({ cryptoer: 'SM2', hasher: 'SM3' });
        expect(await runEpic(reconnectCryptoCheckEpic, [reconnected()], signedIn(null, false), { api })).toEqual([]);
        expect(client.getUid).not.toHaveBeenCalled();
    });
});
