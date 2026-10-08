/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { runEpic } from 'test/runEpic';
import { decryptPrivateKey, privateKeyFromMnemonic } from 'lib/keyring';
import { createWallet } from '../actions';
import { navigate } from 'modules/router/actions';
import createWalletEpic from './createWalletEpic';

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('createWalletEpic', () => {
    it('keeps handling requests after one fails', async () => {
        const failing = { seed: 'not a recovery phrase', password: 'p' };
        const succeeding = { seed: MNEMONIC, password: 'p' };

        const output = await runEpic(createWalletEpic, [createWallet.started(failing), createWallet.started(succeeding)]);

        expect(output[0]).toEqual(createWallet.failed({ params: failing, error: 'E_IMPORT_FAILED' }));
        expect(output.map(a => a.type)).toEqual([createWallet.failed.type, createWallet.done.type, navigate({ to: '/' }).type]);

        const done = output[1] as ReturnType<typeof createWallet.done>;
        expect(await decryptPrivateKey(done.payload.result.encKey, 'p')).toBe(privateKeyFromMnemonic(MNEMONIC));
    }, 20000);
});
