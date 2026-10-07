/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webConfig, { networkFromSettings } from './webConfig';
import reducer from 'modules/storage/reducer';
import { savePreconfiguredNetworks } from 'modules/storage/actions';

// The template every build's public/settings.json is seeded from (vite.config.ts)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const template = JSON.parse(readFileSync(path.join(ROOT, 'public/settings.json.dist'), 'utf8'));

describe('settings template', () => {
    it('is a valid configuration', async () => {
        await expect(webConfig.validate(template)).resolves.toBeTruthy();
    });

    it('names the block explorer of each IBAX network, where the wallet finds UTXO transfers', () => {
        const explorers = Object.fromEntries(template.networks.map((network: { key: string, explorer?: string }) => [network.key, network.explorer]));
        expect(explorers).toEqual({
            MAINNET_NETWORK: 'https://scan.ibax.network:8800/api/v2',
            TESTNET_NETWORK: 'https://testscan.ibax.network:8800/api/v2',
            // A local network has none: the wallet says UTXO transfers cannot be listed
            LOCAL_NETWORK: undefined
        });
    });

    it('takes only an https explorer', async () => {
        const network = { ...template.networks[0], explorer: 'http://scan.example/api/v2' };
        await expect(webConfig.validate({ ...template, networks: [network] })).rejects.toThrow();
    });

    it('stores each network with its block explorer, over what was stored before', async () => {
        const config = await webConfig.validate(template);
        const networks = config.networks.map(networkFromSettings);
        expect(networks.map(network => [network.uuid, network.explorer])).toEqual([
            ['MAINNET_NETWORK', 'https://scan.ibax.network:8800/api/v2'],
            ['TESTNET_NETWORK', 'https://testscan.ibax.network:8800/api/v2'],
            ['LOCAL_NETWORK', undefined]
        ]);
        // A stored network takes the settings' explorer, and loses one the settings no longer name
        const stored = reducer(undefined, savePreconfiguredNetworks([{ ...networks[1], explorer: 'https://old.example/api/v2' }, { ...networks[2], explorer: 'https://gone.example/api/v2' }]));
        const next = reducer(stored, savePreconfiguredNetworks(networks));
        expect(next.networks.map(network => [network.uuid, network.explorer]).sort()).toEqual([
            ['LOCAL_NETWORK', undefined],
            ['MAINNET_NETWORK', 'https://scan.ibax.network:8800/api/v2'],
            ['TESTNET_NETWORK', 'https://testscan.ibax.network:8800/api/v2']
        ]);
    });
});
