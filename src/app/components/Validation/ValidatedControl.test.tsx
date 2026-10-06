/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect } from 'vitest';
import { setInputValue } from 'test/dom';
import ValidatedControl from './ValidatedControl';

const render = async (element: React.ReactElement) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(() => root.render(element));
    return { container, root };
};

describe('ValidatedControl', () => {
    it('never mirrors a typed password into the value attribute, where CSS could read it', async () => {
        const control = React.createRef<ValidatedControl>();
        const { container, root } = await render(<ValidatedControl ref={control} name="password" type="password" />);
        const input = container.querySelector('input');

        await act(() => setInputValue(input, 's3cret'));
        expect(control.current.getValue()).toBe('s3cret');
        expect(input.value).toBe('s3cret');
        expect(input.getAttribute('value')).toBeNull();
        expect(document.querySelector('input[value^="s"]')).toBeNull();

        // A value set by the parent reaches the field the same way
        await act(() => root.render(<ValidatedControl ref={control} name="password" type="password" value="reset" />));
        expect(input.value).toBe('reset');
        expect(input.getAttribute('value')).toBeNull();
        await act(() => root.unmount());
        container.remove();
    });

    it('keeps other fields controlled (negative control)', async () => {
        const { container, root } = await render(<ValidatedControl name="name" type="text" />);
        const input = container.querySelector('input');
        await act(() => setInputValue(input, 'abc'));
        expect(input.getAttribute('value')).toBe('abc');
        await act(() => root.unmount());
        container.remove();
    });
});
