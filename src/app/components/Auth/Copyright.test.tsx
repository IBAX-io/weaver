/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Copyright from './Copyright';
import en from '../../../../public/locales/en-US.json';
import zh from '../../../../public/locales/zh-CN.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const rendered = async (locale: string, messages: Record<string, string>) => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(() => root.render(<IntlProvider locale={locale} messages={messages}><Copyright /></IntlProvider>));
    const text = container.textContent;
    await act(() => root.unmount());
    return text;
};

describe('Copyright', () => {
    afterEach(() => vi.useRealTimers());

    it('runs to the current year, written as a year in every language', async () => {
        vi.useFakeTimers({ now: new Date(2031, 5, 1), toFake: ['Date'] });
        expect(await rendered('en-US', en)).toBe('IBAX © 2019 – 2031');
        expect(await rendered('zh-CN', zh)).toBe('IBAX © 2019 – 2031');
    });
});
