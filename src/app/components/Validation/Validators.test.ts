/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { privateKeyFromBackup } from 'lib/keyring';
import { backup, mnemonic } from './Validators';

// The BIP39 test vector and the key it derives (public, see lib/keyring.test.ts)
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';

describe('wallet backup validators', () => {
    it('lets the import form take what the import accepts: a private key or a recovery phrase', () => {
        for (const value of [PRIVATE_KEY, PRIVATE_KEY.toUpperCase(), ` ${PRIVATE_KEY}\n`, MNEMONIC]) {
            expect([value, backup.validate(value)]).toEqual([value, true]);
            expect(privateKeyFromBackup(value)).toBe(PRIVATE_KEY);
        }
    });

    it('refuses what the import would refuse', () => {
        for (const value of ['', PRIVATE_KEY.slice(1), PRIVATE_KEY + '0', 'abandon abandon', 'not a key']) {
            expect([value, backup.validate(value)]).toEqual([value, false]);
            expect(privateKeyFromBackup(value)).toBeNull();
        }
    });

    it('keeps creating a wallet to recovery phrases (negative control)', () => {
        expect(mnemonic.validate(MNEMONIC)).toBe(true);
        expect(mnemonic.validate(PRIVATE_KEY)).toBe(false);
    });
});
