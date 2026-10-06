/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IBalanceResponse } from 'ibax/api';
import { ISendTransferCall, IWalletBalance } from 'modules/wallet/actions';
import { setInputValue } from 'test/dom';
import UtxoTransferForm from './UtxoTransferForm';
import TransferSelfForm from './TransferSelfForm';
import messages from '../../../../../public/locales/en-US.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const VALUE: IBalanceResponse = {
    amount: '5000000000000',
    utxo: '2000000000000',
    total: '7000000000000',
    digits: 12,
    token_symbol: 'IBXC',
    token_name: 'IBAX Coin'
};
const BALANCE: IWalletBalance = { value: VALUE, fee: VALUE };

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
    const utxoForm = (props: Partial<React.ComponentProps<typeof UtxoTransferForm>> = {}) =>
        render(<UtxoTransferForm balance={BALANCE} ecosystem="1" disabled={false} pending={false} onSubmit={onSubmit} {...props} />);

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
        await utxoForm();
        await submit();
        expect(feedback()).toEqual(['Required', 'Required']);

        await type('wallet-utxo-recipient', '0059-7920-1508-6419-2935');
        await type('wallet-utxo-amount', '2.5');
        await submit();
        expect(feedback()).toEqual(['Not a valid address: check every digit', 'More than the available balance']);

        await type('wallet-utxo-amount', '0.0000000000001');
        expect(feedback()).toContain('At most 12 decimal places');

        await type('wallet-utxo-amount', '1,5');
        expect(feedback()).toContain('Use a dot as the decimal separator, without thousands separators');

        // Each check blocks on its own: a valid amount does not let a mistyped address through
        await type('wallet-utxo-amount', '1');
        await submit();
        expect(feedback()).toEqual(['Not a valid address: check every digit']);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call an untouched recipient missing before the form is sent', async () => {
        await utxoForm();
        // Clicking into the field and out again
        await act(() => {
            field('wallet-utxo-recipient').focus();
            field('wallet-utxo-recipient').blur();
        });
        expect(feedback()).toEqual([]);

        // A mistyped address shows as soon as the field is left
        // (the same focus and blur, so this also shows the blur above did reach the form)
        await type('wallet-utxo-recipient', '0059-7920-1508-6419-2935');
        await act(() => {
            field('wallet-utxo-recipient').focus();
            field('wallet-utxo-recipient').blur();
        });
        expect(feedback()).toEqual(['Not a valid address: check every digit']);
    });

    it('ties each error to its field for screen readers', async () => {
        await utxoForm();
        await submit();
        const amount = field('wallet-utxo-amount');
        expect(amount.getAttribute('aria-invalid')).toBe('true');
        const described = amount.getAttribute('aria-describedby').split(' ').map(id => container.querySelector(`#${id}`).textContent);
        expect(described).toEqual(['Required', 'UTXO balance: 2 IBXC']);
        expect(field('wallet-utxo-recipient').getAttribute('aria-describedby')).toContain('wallet-utxo-recipient-error');
    });

    it('submits a UTXO transfer in base units to the parsed account', async () => {
        await utxoForm();
        await type('wallet-utxo-recipient', ' 0059-7920-1508-6419-2934 ');
        await type('wallet-utxo-amount', '1.25');
        await submit();

        expect(feedback()).toEqual([]);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        const call = onSubmit.mock.calls[0][0];
        expect(call.transfer).toEqual({ type: 'utxo', toID: '597920150864192934', amount: '1250000000000' });
        expect(call.confirm.description).toBe('1.25 IBXC will be sent to 0059-7920-1508-6419-2934. The network fee is paid from your UTXO balance on top of it. A transfer cannot be reversed.');
        expect(call.unknownRecipientWarning).toMatch(/no account on this network/);
    });

    it('leaves room for the network fee', async () => {
        await utxoForm();
        await type('wallet-utxo-recipient', '0059-7920-1508-6419-2934');
        await type('wallet-utxo-amount', '2');
        await submit();
        expect(feedback()).toEqual(['Leave some of the UTXO balance for the network fee']);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('cannot send from another ecosystem without UTXO in ecosystem 1 to pay the fee', async () => {
        await utxoForm({ ecosystem: '2', balance: { value: VALUE, fee: { ...VALUE, utxo: '0' } } });
        expect(container.textContent).toContain('The network fee is paid from your UTXO balance in ecosystem 1, which is empty.');
        expect(field('wallet-utxo-amount').disabled).toBe(true);
        expect(container.querySelector<HTMLButtonElement>('button[type=submit]').disabled).toBe(true);
    });

    it('explains where the fee comes from in another ecosystem', async () => {
        await utxoForm({ ecosystem: '2', balance: { value: { ...VALUE, token_symbol: 'ABC' }, fee: { ...VALUE, utxo: '3000000000000' } } });
        expect(container.textContent).toContain('ecosystem 1 (3 IBXC)');
        await type('wallet-utxo-recipient', '0059-7920-1508-6419-2934');
        await type('wallet-utxo-amount', '1');
        await submit();
        expect(onSubmit.mock.calls[0][0].confirm.description).toContain('paid from your UTXO balance in ecosystem 1');
    });

    it('checks a move against the balance it comes from', async () => {
        await render(<TransferSelfForm balance={VALUE} disabled={false} pending={false} onSubmit={onSubmit} />);
        await type('wallet-move-amount', '5');
        await submit();
        expect(onSubmit.mock.calls[0][0].transfer).toEqual({ type: 'transferSelf', amount: '5000000000000', direction: 'toUTXO' });

        await type('wallet-move-direction', 'toAccount');
        expect(feedback()).toEqual(['More than the available balance']);
        await submit();
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows that a transfer is being sent and cannot be used meanwhile', async () => {
        await utxoForm({ disabled: true, pending: true });
        const button = container.querySelector<HTMLButtonElement>('button[type=submit]');
        expect(field('wallet-utxo-recipient').disabled).toBe(true);
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.textContent).toBe('Sending…');
    });
});
