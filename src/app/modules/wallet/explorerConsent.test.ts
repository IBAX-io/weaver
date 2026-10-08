/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { IRootState } from 'modules';
import mockState from 'test/mockStore';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import storage from 'modules/storage/reducer';
import { allowExplorer } from 'modules/storage/actions';
import { explorerAllowed, explorerConsent, sessionExplorer } from './selectors';

const EXPLORER = 'https://scan.example/api/v2';

// Signed in on the testnet, whose explorer is `explorer`, with what the user agreed to
const on = (explorer: string | undefined, allowed: string[]): IRootState => ({
    ...mockState,
    auth: { ...mockState.auth, session: { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 't', cryptoSuite: DEFAULT_CRYPTO_SUITE } },
    storage: { ...mockState.storage, explorerAllowed: allowed, networks: [{ uuid: 'testnet', id: 5, name: 'Testnet', honorNodes: ['http://node'], explorer }] }
});

describe('consent to send account addresses to a block explorer', () => {
    it('holds for the network and the explorer agreed to only', () => {
        expect(explorerAllowed(on(EXPLORER, [explorerConsent('testnet', EXPLORER)]))).toBe(true);
        // Another explorer for the network (its settings changed), another network, an earlier
        // version's consent (the uuid alone), none
        expect(explorerAllowed(on('https://other.example/api/v2', [explorerConsent('testnet', EXPLORER)]))).toBe(false);
        expect(explorerAllowed(on(EXPLORER, [explorerConsent('mainnet', EXPLORER)]))).toBe(false);
        expect(explorerAllowed(on(EXPLORER, ['testnet']))).toBe(false);
        expect(explorerAllowed(on(EXPLORER, []))).toBe(false);
    });

    it('is never for an explorer at a plain http address', () => {
        const http = 'http://scan.example/api/v2';
        expect(sessionExplorer(on(http, []))).toBeNull();
        expect(explorerAllowed(on(http, [explorerConsent('testnet', http)]))).toBe(false);
        expect(sessionExplorer(on(EXPLORER, []))).toBe(EXPLORER);
    });

    it('replaces what was agreed to for the network before, keeping other networks\'', () => {
        const before = { ...mockState.storage, explorerAllowed: ['testnet', explorerConsent('testnet', 'https://old.example'), explorerConsent('mainnet', EXPLORER)] };
        const after = storage(before, allowExplorer(explorerConsent('testnet', EXPLORER)));
        expect(after.explorerAllowed).toEqual([explorerConsent('mainnet', EXPLORER), explorerConsent('testnet', EXPLORER)]);
        // Agreeing again changes nothing
        expect(storage(after, allowExplorer(explorerConsent('testnet', EXPLORER))).explorerAllowed).toEqual(after.explorerAllowed);
    });
});
