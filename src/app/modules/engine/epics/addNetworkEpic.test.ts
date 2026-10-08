/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { runEpic } from 'test/runEpic';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { discover } from 'services/network';
import { saveNetwork } from 'modules/storage/actions';
import { addNetwork } from '../actions';
import addNetworkEpic from './addNetworkEpic';

vi.mock('services/network', () => ({ discover: vi.fn() }));

describe('addNetworkEpic', () => {
    it('stores the network with the block explorer given, or none', async () => {
        for (const explorer of ['https://scan.example/api/v2', undefined]) {
            vi.mocked(discover).mockResolvedValueOnce({ honorNodes: ['http://node'], networkID: 7, cryptoSuite: DEFAULT_CRYPTO_SUITE } as never);
            const out = await runEpic(addNetworkEpic, [addNetwork.started({ name: 'Mine', apiHost: 'http://node', explorer })]);
            const saved = out.find(action => saveNetwork.match(action)) as ReturnType<typeof saveNetwork>;
            expect(saved.payload).toMatchObject({ name: 'Mine', id: 7, honorNodes: ['http://node'], explorer });
        }
    });
});
