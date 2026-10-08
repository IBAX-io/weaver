/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { cryptoSuiteFromNode, DEFAULT_CRYPTO_SUITE, ICryptoSuiteId } from 'lib/crypto/suites';
import IbaxAPI from 'lib/ibaxAPI';
import { acquireSession, cryptoChanged, E_CRYPTO_CHANGED, E_TOKENEXPIRED, logout, sessionExpired } from '../actions';
import logoutEmptySessionEpic from './logoutEmptySessionEpic';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };
const signedIn = (isAuthenticated = true) => ({ ...mockState, auth: { ...mockState.auth, isAuthenticated, session } } as IRootState);
const expired = sessionExpired({ reason: E_TOKENEXPIRED, network: 'net', during: 'session' });
const changed = cryptoChanged({ reason: E_CRYPTO_CHANGED, network: 'net', during: 'session' });
const failed = (error: string) => ({ type: 'ANY_REQUEST_FAILED', payload: { error } });

// The node: the suite its /getuid reports, or no answer (null)
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

describe('logoutEmptySessionEpic', () => {
    it.each(['E_UNAUTHORIZED', 'E_TOKENEXPIRED'])('signs out once when requests find the token refused (%s), saying the session expired', async error => {
        const { client, api } = node(DEFAULT_CRYPTO_SUITE);
        expect(await runEpic(logoutEmptySessionEpic, [failed(error), failed(error)], signedIn(), { api }))
            .toEqual([expired, logout.started(null)]);
        expect(client.getUid).toHaveBeenCalledTimes(1);
    });

    it('says the algorithms changed when the node refusing the token uses other ones (a redeployed chain)', async () => {
        const { api } = node({ cryptoer: 'SM2', hasher: 'SM3' });
        expect(await runEpic(logoutEmptySessionEpic, [failed('E_UNAUTHORIZED')], signedIn(), { api }))
            .toEqual([changed, logout.started(null)]);
    });

    it('says the session expired when the node cannot be asked', async () => {
        const { api } = node(null);
        expect(await runEpic(logoutEmptySessionEpic, [failed('E_TOKENEXPIRED')], signedIn(), { api }))
            .toEqual([expired, logout.started(null)]);
    });

    it('keeps the session while the node does not answer', async () => {
        const { client, api } = node(DEFAULT_CRYPTO_SUITE);
        expect(await runEpic(logoutEmptySessionEpic, [failed('E_OFFLINE')], signedIn(), { api })).toEqual([]);
        expect(client.getUid).not.toHaveBeenCalled();
    });

    it('leaves a session being restored to acquireSessionEpic', async () => {
        const { api } = node(DEFAULT_CRYPTO_SUITE);
        expect(await runEpic(logoutEmptySessionEpic, [acquireSession.failed({ params: session, error: 'E_UNAUTHORIZED' })], signedIn(), { api })).toEqual([]);
    });

    it('does nothing when nobody is signed in', async () => {
        const { api } = node(DEFAULT_CRYPTO_SUITE);
        expect(await runEpic(logoutEmptySessionEpic, [failed('E_UNAUTHORIZED')], signedIn(false), { api })).toEqual([]);
    });
});
