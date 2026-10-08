/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import SessionRetry from '.';
import en from '../../../../public/locales/en-US.json';
import zh from '../../../../public/locales/zh-CN.json';
import tr from '../../../../public/locales/tr-TR.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = async (locale: string, messages: Record<string, string>, reason: 'E_OFFLINE' | 'E_UPDATING' = 'E_OFFLINE') => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const onRetry = vi.fn();
    const onSignOut = vi.fn();
    await act(() => root.render(
        <IntlProvider locale={locale} messages={messages} onError={() => { throw new Error(`missing message in ${locale}`); }}>
            <SessionRetry reason={reason} onRetry={onRetry} onSignOut={onSignOut} />
        </IntlProvider>
    ));
    return { container, root, onRetry, onSignOut };
};

describe('SessionRetry', () => {
    it('says why the account is not open yet, and that the user is still signed in', async () => {
        const { container, root } = await render('en-US', en);
        expect(container.textContent).toContain('Could not connect to the service');
        expect(container.textContent).toContain('You are still signed in.');
        await act(() => root.unmount());
        const updating = await render('en-US', en, 'E_UPDATING');
        expect(updating.container.textContent).toContain('Node is updating blockchain');
        await act(() => updating.root.unmount());
    });

    it('is translated into every language', async () => {
        for (const [locale, messages] of [['zh-CN', zh], ['tr-TR', tr]] as const) {
            const { root } = await render(locale, messages);
            await act(() => root.unmount());
        }
    });

    it('asks again or signs out when told to', async () => {
        const { container, root, onRetry, onSignOut } = await render('en-US', en);
        const [retry, signOut] = Array.from(container.querySelectorAll('button'));
        await act(() => retry.click());
        expect(onRetry).toHaveBeenCalledTimes(1);
        await act(() => signOut.click());
        expect(onSignOut).toHaveBeenCalledTimes(1);
        await act(() => root.unmount());
    });
});
