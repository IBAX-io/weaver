/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useId, useState } from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

export interface IAddressSuggestion {
    address: string;
    location: [number, number];
}

export interface IAddressComboboxProps {
    value: string;
    suggestions: IAddressSuggestion[];
    onChange: (value: string) => void;
    onSuggestionsFetchRequested: (value: string) => void;
    onSuggestionsClearRequested: () => void;
    onSuggestionSelected: (suggestion: IAddressSuggestion) => void;
}

const StyledCombobox = styled.div`
    position: relative;

    .address-combobox__listbox {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #fff;
        z-index: 10;
        list-style-type: none;
        padding: 0;
        margin: 0;
        border-right: 1px solid #66afe9;
        border-left: 1px solid #66afe9;
        border-bottom: 1px solid #66afe9;
    }

    .address-combobox__option {
        padding: 10px;
        cursor: pointer;
    }

    .address-combobox__option_active {
        background: #fafafa;
    }
`;

const shouldFetch = (value: string) => value.trim().length > 0;

/**
 * Text input with a list of address suggestions (WAI-ARIA combobox pattern, list autocomplete).
 * Up/Down move the active option, Enter selects it, Escape closes the list (or clears the
 * input when the list is already closed).
 */
const AddressCombobox: React.FC<IAddressComboboxProps> = props => {
    const intl = useIntl();
    const label = intl.formatMessage({ id: 'general.address', defaultMessage: 'Address' });
    const id = useId();
    const listboxId = `${id}-listbox`;
    const optionId = (index: number) => `${id}-option-${index}`;
    const [activeIndex, setActiveIndex] = useState(-1);
    const [prevSuggestions, setPrevSuggestions] = useState(props.suggestions);
    if (prevSuggestions !== props.suggestions) {
        setPrevSuggestions(props.suggestions);
        setActiveIndex(-1);
    }

    const isOpen = props.suggestions.length > 0;

    const select = (suggestion: IAddressSuggestion) => {
        props.onChange(suggestion.address);
        props.onSuggestionSelected(suggestion);
        props.onSuggestionsClearRequested();
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        props.onChange(value);
        if (shouldFetch(value)) {
            props.onSuggestionsFetchRequested(value);
        }
        else {
            props.onSuggestionsClearRequested();
        }
    };

    const onFocus = () => {
        if (shouldFetch(props.value)) {
            props.onSuggestionsFetchRequested(props.value);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'ArrowDown':
                if (isOpen) {
                    e.preventDefault();
                    setActiveIndex((activeIndex + 1) % props.suggestions.length);
                }
                break;

            case 'ArrowUp':
                if (isOpen) {
                    e.preventDefault();
                    setActiveIndex(activeIndex <= 0 ? props.suggestions.length - 1 : activeIndex - 1);
                }
                break;

            case 'Enter':
                if (isOpen && activeIndex >= 0) {
                    e.preventDefault();
                    select(props.suggestions[activeIndex]);
                }
                break;

            case 'Escape':
                if (isOpen) {
                    e.preventDefault();
                    props.onSuggestionsClearRequested();
                }
                else if (props.value) {
                    e.preventDefault();
                    props.onChange('');
                }
                break;

            default:
                break;
        }
    };

    return (
        <StyledCombobox>
            <input
                type="text"
                className="form-control"
                role="combobox"
                aria-label={label}
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                autoComplete="off"
                value={props.value}
                onChange={onInputChange}
                onFocus={onFocus}
                onBlur={props.onSuggestionsClearRequested}
                onKeyDown={onKeyDown}
            />
            <ul id={listboxId} role="listbox" aria-label={label} className="address-combobox__listbox" hidden={!isOpen}>
                {props.suggestions.map((suggestion, index) => (
                    <li
                        key={`${index}-${suggestion.address}`}
                        id={optionId(index)}
                        role="option"
                        aria-selected={index === activeIndex}
                        className={index === activeIndex ? 'address-combobox__option address-combobox__option_active' : 'address-combobox__option'}
                        onMouseDown={e => e.preventDefault()}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(suggestion)}
                    >
                        {suggestion.address}
                    </li>
                ))}
            </ul>
        </StyledCombobox>
    );
};

export default AddressCombobox;
