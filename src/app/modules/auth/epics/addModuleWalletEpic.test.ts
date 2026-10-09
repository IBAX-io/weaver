/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { runEpic } from 'test/runEpic';
import { IModuleKeyRef } from 'ibax/auth';
import { createModuleWallet } from 'lib/keyring';
import { resolveCryptoSuite } from 'lib/crypto/suites';
import { navigate } from 'modules/router/actions';
import { addModuleWallet } from '../actions';
import addModuleWalletEpic from './addModuleWalletEpic';

const KEY: IModuleKeyRef = {
    token: { serial: 'S1', label: 'Token' },
    id: '01',
    label: 'Key',
    cryptoer: 'ECC_P256',
    publicKey: resolveCryptoSuite({ cryptoer: 'ECC_P256', hasher: 'SHA256' }).publicKey('1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727')
};

describe('addModuleWalletEpic', () => {
    it('stores the key\'s wallet and goes to the account list', async () => {
        const output = await runEpic(addModuleWalletEpic, [addModuleWallet.started(KEY)]);

        expect(output).toEqual([
            addModuleWallet.done({ params: KEY, result: createModuleWallet(KEY) }),
            navigate({ to: '/' })
        ]);
    });
});
