/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IBalanceResponse } from 'ibax/api';
import { ISendTransferCall } from 'modules/wallet/actions';
import UtxoTransferForm from './UtxoTransferForm';
import TransferSelfForm from './TransferSelfForm';
import messages from '../../../../../public/locales/en-US.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const BALANCE: IBalanceResponse = {
    amount: '5000000000000',
    utxo: '2000000000000',
    total: '7000000000000',
    digits: 12,
    token_symbol: 'IBXC',
    token_name: 'IBAX Coin'
};

const setInputValue = (input: HTMLInputElement | HTMLSelectElement, value: string) => {
    const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
};

describe('wallet forms', () => {
    let container: HTMLDivElement;
    let root: Root;
    let onSubmit: ReturnType<typeof vi.fn<(call: ISendTransferCall) => void>>;

    const field = (id: string) => container.querySelector<HTMLInputElement & HTMLSelectElement>(`#${id}`);
    const feedback = () => [...container.querySelectorAll('.invalid-feedback')].map(e => e.textContent).filter(Boolean);
    const submit = () => act(() => {
        container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    const type = (id: string, value: string) => act(() => setInputValue(field(id), value));

    const render = (element: React.ReactElement) => act(() => {
        root.render(<IntlProvider locale="en-US" messages={messages} textComponent="span">{element}</IntlProvider>);
    });

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        onSubmit = vi.fn<(call: ISendTransferCall) => void>();
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it('does not submit an invalid transfer and says why', async () => {
        await render(<UtxoTransferForm balance={BALANCE} disabled={false} onSubmit={onSubmit} />);
        await submit();
        expect(feedback()).toEqual(['Required', 'Required']);

        await type('wallet-utxo-recipient', '0059-7920-1508-6419-2935');
        await type('wallet-utxo-amount', '2.5');
        await submit();
        expect(feedback()).toEqual(['Not a valid address: check every digit', 'More than the available balance']);

        await type('wallet-utxo-amount', '0.0000000000001');
        expect(feedback()).toContain('At most 12 decimal places');

        // Each check blocks on its own: a valid amount does not let a mistyped address through
        await type('wallet-utxo-amount', '1');
        await submit();
        expect(feedback()).toEqual(['Not a valid address: check every digit']);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits a UTXO transfer in base units to the parsed account', async () => {
        await render(<UtxoTransferForm balance={BALANCE} disabled={false} onSubmit={onSubmit} />);
        await type('wallet-utxo-recipient', ' 0059-7920-1508-6419-2934 ');
        await type('wallet-utxo-amount', '1.25');
        await type('wallet-utxo-comment', '  rent  ');
        await submit();

        expect(feedback()).toEqual([]);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.transfer).toEqual({ type: 'utxo', recipient: '597920150864192934', amount: '1250000000000', comment: 'rent' });
        expect(call.confirm.description).toBe('1.25 IBXC will be sent to 0059-7920-1508-6419-2934. Network fees are paid from your UTXO balance. A transfer cannot be reversed.');
    });

    it('checks a move against the balance it comes from', async () => {
        await render(<TransferSelfForm balance={BALANCE} disabled={false} onSubmit={onSubmit} />);
        await type('wallet-move-amount', '4');
        await submit();
        expect(onSubmit.mock.calls[0][0].transfer).toEqual({ type: 'transferSelf', amount: '4000000000000', direction: 'toUTXO' });

        await type('wallet-move-direction', 'toAccount');
        expect(feedback()).toEqual(['More than the available balance']);
        await submit();
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('cannot be used while disabled', async () => {
        await render(<UtxoTransferForm balance={BALANCE} disabled onSubmit={onSubmit} />);
        expect(field('wallet-utxo-recipient').disabled).toBe(true);
        expect(container.querySelector<HTMLButtonElement>('button[type=submit]').disabled).toBe(true);
    });
});
