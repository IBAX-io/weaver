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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The generator in a form, as the import and create pages show it; run `check` on it, then unmount
const withGenerator = async <T,>(
    props: { action: 'create' | 'import', seed?: string, locale?: string, tools?: boolean },
    check: (container: HTMLElement, form: ValidatedForm) => T
) => {
    const form = React.createRef<ValidatedForm>();
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => root.render(
        <IntlProvider locale={props.locale || 'en-US'} messages={{}} onError={() => undefined}>
            <ValidatedForm ref={form}>
                <Generator action={props.action} descriptionValue="" seed={props.seed || ''} password="secret123" onSeedChange={() => undefined} onPasswordChange={() => undefined}
                    {...(props.tools ? { onGenerate: () => undefined, onSave: () => undefined, onLoad: () => undefined } : {})} />
            </ValidatedForm>
        </IntlProvider>
    ));
    try {
        return check(container, form.current);
    }
    finally {
        await act(() => root.unmount());
    }
};

// Whether the seed field, filled with `seed`, passes validation
const seedAccepted = (action: 'create' | 'import', seed: string) =>
    withGenerator({ action, seed }, (container, form) => !form.validateAll().payload.seed.error);

// The declarations styled-components wrote for `selector`
const styleOf = (selector: string) => [...document.querySelectorAll('style')]
    .map(tag => tag.textContent).join('')
    .split('}')
    .filter(rule => rule.split('{')[0].split(',').some(part => part.trim().endsWith(selector)))
    .map(rule => rule.split('{')[1])
    .join(';');

describe('wallet generator', () => {
    it('imports a wallet from its private key, not only from a recovery phrase', async () => {
        expect(await seedAccepted('import', PRIVATE_KEY)).toBe(true);
        expect(await seedAccepted('import', 'not a key')).toBe(false);
    });

    it('creates wallets from recovery phrases only (negative control)', async () => {
        expect(await seedAccepted('create', PRIVATE_KEY)).toBe(false);
    });

    it('puts the generate, save and load buttons side by side', async () => {
        const columns = await withGenerator({ action: 'create', tools: true }, container =>
            [...container.querySelectorAll('.row.g-0 > .col-4')].map(column => column.querySelectorAll('button').length));
        expect(columns).toEqual([1, 1, 1]);
    });

    it('shows the password warning at every width, as a small italic note', async () => {
        const note = await withGenerator({ action: 'import' }, container => {
            const element = container.querySelector('.generator__warning');
            return { classes: [...element.classList], text: element.textContent, lang: element.getAttribute('lang') };
        });
        // No responsive display class hides it on a narrow window
        expect(note.classes.filter(name => name.startsWith('d-'))).toEqual([]);
        // What is kept where, so a lost password is understood to be final
        expect(note.text).toMatch(/^Warning: Weaver keeps your private key only on this device, encrypted with your password/);
        expect(note.lang).toBe('en-US');
        expect(styleOf('.generator__warning')).toContain('font-size:12px');
        expect(styleOf('.generator__warning')).toContain('font-style:italic');
        // Not slanted Chinese
        expect(styleOf('.generator__warning:lang(zh)')).toContain('font-style:normal');
        expect(await withGenerator({ action: 'import', locale: 'zh-CN' }, container =>
            container.querySelector('.generator__warning').getAttribute('lang'))).toBe('zh-CN');
    });
});
