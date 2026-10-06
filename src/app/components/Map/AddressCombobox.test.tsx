/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AddressCombobox, { IAddressSuggestion } from './AddressCombobox';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SUGGESTIONS: IAddressSuggestion[] = [
    { address: 'Paris, Île-de-France', location: [2.35, 48.85] },
    { address: 'Paris, Texas', location: [-95.55, 33.66] }
];

interface IHarnessProps {
    onFetch: (value: string) => void;
    onSelected: (suggestion: IAddressSuggestion) => void;
}

const Harness: React.FC<IHarnessProps> = props => {
    const [value, setValue] = useState('');
    const [suggestions, setSuggestions] = useState<IAddressSuggestion[]>([]);
    return (
        <AddressCombobox
            value={value}
            suggestions={suggestions}
            onChange={setValue}
            onSuggestionsFetchRequested={v => {
                props.onFetch(v);
                setSuggestions(SUGGESTIONS);
            }}
            onSuggestionsClearRequested={() => setSuggestions([])}
            onSuggestionSelected={props.onSelected}
        />
    );
};

const setInputValue = (input: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

const key = (input: HTMLInputElement, name: string) => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
};

describe('AddressCombobox', () => {
    let container: HTMLDivElement;
    let root: Root;
    let onFetch: ReturnType<typeof vi.fn<(value: string) => void>>;
    let onSelected: ReturnType<typeof vi.fn<(suggestion: IAddressSuggestion) => void>>;

    const input = () => container.querySelector<HTMLInputElement>('input[role="combobox"]');
    const listbox = () => container.querySelector<HTMLUListElement>('[role="listbox"]');
    const options = () => Array.from(container.querySelectorAll<HTMLLIElement>('[role="option"]'));

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        onFetch = vi.fn<(value: string) => void>();
        onSelected = vi.fn<(suggestion: IAddressSuggestion) => void>();
        act(() => {
            root.render(
                <IntlProvider locale="en-US" messages={{ 'general.address': 'Address' }}>
                    <Harness onFetch={onFetch} onSelected={onSelected} />
                </IntlProvider>
            );
        });
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it('requests suggestions while typing and exposes them as a listbox', () => {
        act(() => setInputValue(input(), 'Paris'));

        expect(onFetch).toHaveBeenCalledWith('Paris');
        expect(input().getAttribute('aria-expanded')).toBe('true');
        expect(input().getAttribute('aria-controls')).toBe(listbox().id);
        expect(input().getAttribute('aria-label')).toBe('Address');
        expect(listbox().hidden).toBe(false);
        expect(options().map(o => o.textContent)).toEqual(SUGGESTIONS.map(s => s.address));
    });

    it('does not request suggestions for blank input', () => {
        act(() => setInputValue(input(), '   '));

        expect(onFetch).not.toHaveBeenCalled();
        expect(input().getAttribute('aria-expanded')).toBe('false');
        expect(listbox().hidden).toBe(true);
    });

    it('moves the active option with arrow keys and wraps around', () => {
        act(() => setInputValue(input(), 'Paris'));

        act(() => key(input(), 'ArrowDown'));
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[0].id);
        expect(options()[0].getAttribute('aria-selected')).toBe('true');

        act(() => key(input(), 'ArrowDown'));
        act(() => key(input(), 'ArrowDown'));
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[0].id);

        act(() => key(input(), 'ArrowUp'));
        expect(input().getAttribute('aria-activedescendant')).toBe(options()[1].id);
    });

    it('selects the active option with Enter and closes the list', () => {
        act(() => setInputValue(input(), 'Paris'));
        act(() => key(input(), 'ArrowDown'));
        act(() => key(input(), 'ArrowDown'));
        act(() => key(input(), 'Enter'));

        expect(onSelected).toHaveBeenCalledWith(SUGGESTIONS[1]);
        expect(input().value).toBe(SUGGESTIONS[1].address);
        expect(input().getAttribute('aria-expanded')).toBe('false');
        expect(input().hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('selects an option on click', () => {
        act(() => setInputValue(input(), 'Paris'));
        act(() => options()[0].click());

        expect(onSelected).toHaveBeenCalledWith(SUGGESTIONS[0]);
        expect(input().value).toBe(SUGGESTIONS[0].address);
    });

    it('closes the list with Escape, then clears the input on a second Escape', () => {
        act(() => setInputValue(input(), 'Paris'));

        act(() => key(input(), 'Escape'));
        expect(input().getAttribute('aria-expanded')).toBe('false');
        expect(input().value).toBe('Paris');

        act(() => key(input(), 'Escape'));
        expect(input().value).toBe('');
        expect(onSelected).not.toHaveBeenCalled();
    });

    it('ignores Enter when no option is active', () => {
        act(() => setInputValue(input(), 'Paris'));
        act(() => key(input(), 'Enter'));

        expect(onSelected).not.toHaveBeenCalled();
        expect(input().getAttribute('aria-expanded')).toBe('true');
    });
});
