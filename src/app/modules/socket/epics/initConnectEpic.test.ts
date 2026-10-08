/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import Centrifuge from 'centrifuge';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import IbaxAPI from 'lib/ibaxAPI';
import { acquireSession } from 'modules/auth/actions';
import { discoverNetwork, initialize } from 'modules/engine/actions';
import initConnectEpic from './initConnectEpic';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };

const state = (isAuthenticated: boolean, socket: Centrifuge = null) => ({
    ...mockState,
    storage: { ...mockState.storage, networks: [{ uuid: 'net', id: 1, name: 'net', honorNodes: ['http://node'] }] },
    engine: { ...mockState.engine, guestSession: session },
    auth: { ...mockState.auth, isAuthenticated, session },
    socket: { ...mockState.socket, socket }
} as IRootState);

// Which actions start connecting (the node then does not answer, so nothing else happens)
const connects = async (action: Parameters<typeof runEpic>[1][number], current: IRootState) => {
    const api = vi.fn(() => ({ getUid: async () => { throw { error: 'E_OFFLINE' }; } }));
    await runEpic(initConnectEpic, [action], current, { api: api as unknown as (params: unknown) => IbaxAPI });
    return 0 < api.mock.calls.length;
};

describe('initConnectEpic', () => {
    const started = initialize.done({ params: undefined, result: { defaultNetwork: 'net', preconfiguredNetworks: [], locales: [] } });

    it('connects once the network is discovered', async () => {
        expect(await connects(discoverNetwork.done({ params: { uuid: 'net' }, result: { session } }), state(false))).toBe(true);
    });

    it('at start, connects a restored session at once, and leaves a signed-out one to the discovery', async () => {
        expect(await connects(started, state(true))).toBe(true);
        expect(await connects(started, state(false))).toBe(false);
    });

    it('connects a session restored after the node answered again, if not connected yet', async () => {
        const acquired = acquireSession.done({ params: session, result: true });
        expect(await connects(acquired, state(true))).toBe(true);
        expect(await connects(acquired, state(true, {} as Centrifuge))).toBe(false);
    });
});
