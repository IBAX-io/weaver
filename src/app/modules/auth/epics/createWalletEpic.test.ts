/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, afterEach } from 'vitest';
import keyring from 'lib/keyring';
import { runEpic } from 'test/runEpic';
import { createWallet } from '../actions';
import { navigate } from 'modules/engine/actions';
import createWalletEpic from './createWalletEpic';

describe('createWalletEpic', () => {
    afterEach(() => vi.restoreAllMocks());

    it('keeps handling requests after one fails', async () => {
        const realGenerate = keyring.generateKeyPair;
        vi.spyOn(keyring, 'generateKeyPair')
            .mockImplementationOnce(() => { throw new Error('bad seed'); })
            .mockImplementation(realGenerate);

        const failing = { seed: 'first', password: 'p' };
        const succeeding = { seed: 'second', password: 'p' };
        const output = await runEpic(createWalletEpic, [createWallet.started(failing), createWallet.started(succeeding)]);

        expect(output[0]).toEqual(createWallet.failed({ params: failing, error: 'E_IMPORT_FAILED' }));
        expect(createWallet.done.match(output[1])).toBe(true);
        expect(output.map(a => a.type)).toEqual([createWallet.failed.type, createWallet.done.type, navigate('/').type]);
    });
});
