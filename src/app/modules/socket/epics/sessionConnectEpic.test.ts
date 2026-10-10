/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import IbaxAPI from 'lib/ibaxAPI';
import { acquireSession } from 'modules/auth/actions';
import { connect } from '../actions';
import sessionConnectEpic from './sessionConnectEpic';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', notifyKey: 'notify', cryptoSuite: DEFAULT_CRYPTO_SUITE };

const state = ({ isAuthenticated = true, connectedSession = null as string, socketUrl = undefined as string } = {}) => ({
    ...mockState,
    storage: { ...mockState.storage, networks: [{ uuid: 'net', id: 1, name: 'net', honorNodes: ['http://node'], socketUrl }] },
    auth: { ...mockState.auth, isAuthenticated, session },
    socket: { ...mockState.socket, session: connectedSession }
} as IRootState);

const run = async (acquired: ISession, current: IRootState) => {
    const getCentrifugo = vi.fn(async () => ({ url: 'ws://centrifugo', protocol: 'centrifuge-json', version: '6' }));
    const api = vi.fn(() => ({ getCentrifugo }));
    const out = await runEpic(sessionConnectEpic, [acquireSession.done({ params: acquired, result: true })], current, { api: api as unknown as (params: unknown) => IbaxAPI });
    return { out, asked: getCentrifugo.mock.calls.length };
};

describe('sessionConnectEpic', () => {
    it('connects a signed-in session with its own token, where the node says its Centrifugo is', async () => {
        expect(await run(session, state())).toEqual({
            out: [connect.started({ url: 'ws://centrifugo', token: 'notify', session: 'token' })],
            asked: 1
        });
    });

    it('connects where the network\'s settings say, without asking the node', async () => {
        expect(await run(session, state({ socketUrl: 'wss://notify.example' }))).toEqual({
            out: [connect.started({ url: 'wss://notify.example', token: 'notify', session: 'token' })],
            asked: 0
        });
    });

    it('leaves a session not signed in, one without a token, and one connected already', async () => {
        expect((await run(session, state({ isAuthenticated: false }))).out).toEqual([]);
        expect((await run({ ...session, notifyKey: undefined }, state())).out).toEqual([]);
        expect((await run(session, state({ connectedSession: 'token' }))).out).toEqual([]);
    });

    it('does not connect when the node does not say where its Centrifugo is', async () => {
        const api = vi.fn(() => ({ getCentrifugo: async () => { throw { error: 'E_CENTRIFUGO' }; } }));
        expect(await runEpic(sessionConnectEpic, [acquireSession.done({ params: session, result: true })], state(), { api: api as unknown as (params: unknown) => IbaxAPI })).toEqual([]);
    });
});
