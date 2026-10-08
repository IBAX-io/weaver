/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import IbaxAPI from 'lib/ibaxAPI';
import { createWallet } from 'lib/keyring';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { loadWallets } from '../actions';
import loadWalletsEpic from './loadWalletsEpic';

describe('loadWalletsEpic', () => {
    it('lists every wallet even when the details of one cannot be loaded', async () => {
        const a = await createWallet('1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727', 'pw');
        const b = await createWallet('e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f', 'pw');
        const state: IRootState = {
            ...mockState,
            engine: { ...mockState.engine, guestSession: { network: { uuid: 'n', apiHost: 'http://node' }, sessionToken: '', cryptoSuite: DEFAULT_CRYPTO_SUITE } },
            storage: { ...mockState.storage, wallets: [a, b] }
        };
        const client = new IbaxAPI({ apiHost: 'http://node' });
        vi.spyOn(client, 'keyinfo').mockImplementation(async ({ id }) => {
            if (id === a.id) {
                throw { error: 'E_OFFLINE' };
            }
            return { account: '0059-7920-1508-6419-2934', ecosystems: [] };
        });

        const output = await runEpic(loadWalletsEpic, [loadWallets.started(undefined)], state, { api: () => client });

        expect(output).toHaveLength(1);
        const done = output[0] as ReturnType<typeof loadWallets.done>;
        expect(done.type).toBe(loadWallets.done.type);
        expect(done.payload.result.map(account => [account.walletID, account.address]).sort()).toEqual([[a.id, ''], [b.id, '0059-7920-1508-6419-2934']].sort());
    }, 20000);
});
