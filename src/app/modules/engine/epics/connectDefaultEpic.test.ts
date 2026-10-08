/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { INetwork, ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { LEGACY_CRYPTO_SUITE } from 'lib/crypto/suites';
import { discoverNetwork, initialize } from '../actions';
import connectDefaultEpic from './connectDefaultEpic';

const network = (uuid: string): INetwork => ({ uuid, id: 1, name: uuid, honorNodes: [`http://${uuid}`], disableSync: false });
// Persisted at the last start, under the algorithms the network had then
const guest = (uuid: string): ISession => ({ network: { uuid, apiHost: `http://${uuid}` }, sessionToken: 'guest', cryptoSuite: LEGACY_CRYPTO_SUITE });

const state = (options: { networks: string[]; guestSession?: string; isAuthenticated?: boolean; session?: string }) => ({
    ...mockState,
    storage: { ...mockState.storage, networks: options.networks.map(network) },
    engine: { ...mockState.engine, guestSession: options.guestSession ? guest(options.guestSession) : null },
    auth: { ...mockState.auth, isAuthenticated: !!options.isAuthenticated, session: options.session ? guest(options.session) : null }
} as IRootState);

const started = (defaultNetwork: string) =>
    initialize.done({ params: undefined, result: { defaultNetwork, preconfiguredNetworks: [], locales: [] } });

describe('connectDefaultEpic', () => {
    it('asks the network of the last start again, so the sign-in page is under its algorithms of now', async () => {
        expect(await runEpic(connectDefaultEpic, [started('main')], state({ networks: ['main', 'test'], guestSession: 'test' })))
            .toEqual([discoverNetwork.started({ uuid: 'test' })]);
    });

    it('falls back to the default network when there is none, or it was removed', async () => {
        expect(await runEpic(connectDefaultEpic, [started('main')], state({ networks: ['main'] })))
            .toEqual([discoverNetwork.started({ uuid: 'main' })]);
        expect(await runEpic(connectDefaultEpic, [started('main')], state({ networks: ['main'], guestSession: 'gone' })))
            .toEqual([discoverNetwork.started({ uuid: 'main' })]);
        expect(await runEpic(connectDefaultEpic, [started('unknown')], state({ networks: ['main'] }))).toEqual([]);
    });

    it('leaves a restored session\'s network to the session check', async () => {
        expect(await runEpic(connectDefaultEpic, [started('main')], state({ networks: ['main'], guestSession: 'main', isAuthenticated: true, session: 'main' })))
            .toEqual([]);
    });
});
