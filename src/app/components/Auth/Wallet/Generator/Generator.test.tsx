/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { describe, it, expect } from 'vitest';
import ValidatedForm from 'components/Validation/ValidatedForm';
import Generator from '.';

// The BIP39 test vector's key (public, see lib/keyring.test.ts)
const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';

// Whether the seed field of the generator, filled with `seed`, passes validation
const seedAccepted = async (action: 'create' | 'import', seed: string) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const form = React.createRef<ValidatedForm>();
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => root.render(
        <IntlProvider locale="en-US" messages={{}} onError={() => undefined}>
            <ValidatedForm ref={form}>
                <Generator action={action} descriptionValue="" seed={seed} password="secret123" onSeedChange={() => undefined} onPasswordChange={() => undefined} />
            </ValidatedForm>
        </IntlProvider>
    ));
    const result = form.current.validateAll().payload.seed;
    await act(() => root.unmount());
    return !result.error;
};

describe('wallet generator', () => {
    it('imports a wallet from its private key, not only from a recovery phrase', async () => {
        expect(await seedAccepted('import', PRIVATE_KEY)).toBe(true);
        expect(await seedAccepted('import', 'not a key')).toBe(false);
    });

    it('creates wallets from recovery phrases only (negative control)', async () => {
        expect(await seedAccepted('create', PRIVATE_KEY)).toBe(false);
    });
});
