/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import IbaxAPI from 'lib/ibaxAPI';
import { createModuleWallet, createWallet } from 'lib/keyring';
import { DEFAULT_CRYPTO_SUITE, resolveCryptoSuite } from 'lib/crypto/suites';
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

    describe('a module wallet', () => {
        const P256 = { cryptoer: 'ECC_P256', hasher: 'SHA256' } as const;
        const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';
        const moduleWallet = createModuleWallet({
            token: { serial: 'S1', label: 'Token' }, id: '01', label: 'Key', cryptoer: 'ECC_P256',
            publicKey: resolveCryptoSuite(P256).publicKey('e5a87a96a445cb55a214edaad3661018061ef2936e63a0a93bdb76eb28251c1f')
        });

        const listed = async (fips: boolean) => {
            const software = await createWallet(PRIVATE_KEY, 'pw');
            const state: IRootState = {
                ...mockState,
                engine: { ...mockState.engine, guestSession: { network: { uuid: 'n', apiHost: 'http://node' }, sessionToken: '', cryptoSuite: P256, fips } },
                storage: { ...mockState.storage, wallets: [software, moduleWallet] }
            };
            const client = new IbaxAPI({ apiHost: 'http://node' });
            vi.spyOn(client, 'keyinfo').mockResolvedValue({ account: '', ecosystems: [] });
            const [done] = await runEpic(loadWalletsEpic, [loadWallets.started(undefined)], state, { api: () => client }) as ReturnType<typeof loadWallets.done>[];
            return done.payload.result.map(account => account.walletID).sort();
        };

        it('is the only one listed on a FIPS network', async () => {
            expect(await listed(true)).toEqual([moduleWallet.id]);
        }, 20000);

        it('is listed with the others elsewhere', async () => {
            expect(await listed(false)).toHaveLength(2);
        }, 20000);
    });
});
