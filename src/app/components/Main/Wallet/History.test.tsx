/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { THistoryEntry } from 'modules/wallet/history';
import History from './History';
import en from '../../../../../public/locales/en-US.json';
import zh from '../../../../../public/locales/zh-CN.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HASH = '9aeabd0ea70dd6375ffe92e8dffe72983fb724c3ec0318cada7b1b5dc314424e';
const base = { time: Date.UTC(2026, 9, 6, 14, 53), blockID: '3191', hash: HASH, comment: '' };
const ENTRIES: THistoryEntry[] = [
    { ...base, id: '9', amount: '200000000000000', comment: 'Account', kind: 'move', to: 'utxo' },
    { ...base, id: '8', amount: '100000000000000', kind: 'transfer', direction: 'out', counterparty: '0970-5013-8387-9381-1999' },
    { ...base, id: '7', amount: '2500000000000', kind: 'transfer', direction: 'in', counterparty: '0813-4574-2329-7730-4517', comment: 'rent' },
    { ...base, id: '6', amount: '234386138', kind: 'fee', direction: 'out', counterparty: '0710-7522-6000-5358-8199', penalty: false, comment: 'taxes for execution of @1TokensSendAdapter contract' },
    { ...base, id: '5', amount: '30000000000', kind: 'transfer', direction: 'self', counterparty: null },
    { ...base, id: '4', amount: '1', kind: 'fee', direction: 'self', counterparty: null, penalty: true },
    { ...base, id: '3', amount: '5', kind: 'fee', direction: 'out', counterparty: null, penalty: false },
    { ...base, id: '2', amount: '0', hash: '', kind: 'created' },
    { ...base, id: '1', amount: '7', hash: '', kind: 'created' }
];

const render = async (props: Partial<React.ComponentProps<typeof History>> = {}, locale = 'en-US') => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const handlers = { onFilter: vi.fn(), onMore: vi.fn() };
    const element = (more: Partial<React.ComponentProps<typeof History>> = {}) => (
        <IntlProvider locale={locale} messages={'zh-CN' === locale ? zh : en} timeZone="UTC">
            <History filter="transfers" entries={ENTRIES} more={0} pending={false} error={null} digits={12} symbol="IBXC" {...handlers} {...props} {...more} />
        </IntlProvider>
    );
    await act(() => root.render(element()));
    const rows = () => [...container.querySelectorAll('.wallet__history-entry')].map(row => ({
        what: row.querySelector('.wallet__history-what').textContent,
        amount: row.querySelector('.wallet__history-amount')?.textContent ?? null
    }));
    const button = (text: string) => [...container.querySelectorAll('button')].find(item => item.textContent === text);
    return {
        container, rows, button, handlers,
        rerender: (more: Partial<React.ComponentProps<typeof History>>) => act(() => root.render(element(more))),
        unmount: async () => {
            await act(() => root.unmount());
            container.remove();
        }
    };
};

describe('wallet history', () => {
    it('says what each row was, with the amount out or in', async () => {
        const view = await render();
        expect(view.rows()).toEqual([
            { what: 'Moved to the UTXO balance', amount: '200 IBXC' },
            { what: 'Sent to 0970-5013-8387-9381-1999', amount: '−100 IBXC' },
            { what: 'Received from 0813-4574-2329-7730-4517', amount: '+2.5 IBXC' },
            { what: 'Fee paid to 0710-7522-6000-5358-8199', amount: '−0.000234386138 IBXC' },
            { what: 'Sent to yourself', amount: '0.03 IBXC' },
            { what: 'Fee paid to yourself', amount: '0.000000000001 IBXC' },
            { what: 'Burnt', amount: '−0.000000000005 IBXC' },
            // A creation moves no tokens, or brings some in
            { what: 'Account created', amount: null },
            { what: 'Account created', amount: '+0.000000000007\u00A0IBXC' }
        ]);
        await view.unmount();
    });

    it('labels a contract\'s comment and marks a fee charged for a failed transaction', async () => {
        const view = await render();
        const entry = (index: number) => view.container.querySelectorAll('.wallet__history-entry')[index];
        expect(entry(2).querySelector('.wallet__history-comment').textContent).toBe('Note: rent');
        // Isolated, so its text cannot reorder what is around it
        expect(entry(2).querySelector('.wallet__history-comment bdi').textContent).toBe('rent');
        // A move's source ("Account") is what its line already says
        expect(entry(0).querySelector('.wallet__history-comment')).toBeNull();
        expect(entry(5).querySelector('.wallet__history-penalty').textContent).toBe('The transaction failed; the fee was charged');
        expect(view.container.querySelectorAll('.wallet__history-penalty')).toHaveLength(1);
        await view.unmount();
    });

    it('shortens the transaction hash, with the whole of it to copy', async () => {
        const view = await render();
        const first = view.container.querySelector('.wallet__history-entry');
        expect(first.querySelector('.wallet__history-hash').textContent).toBe('9aeabd0e…14424e');
        expect(first.querySelector('.wallet__history-hash').getAttribute('title')).toBe(HASH);
        expect(first.querySelector('button[aria-label="Copy the transaction hash"]')).not.toBeNull();
        // No hash, no copy button
        expect([...view.container.querySelectorAll('.wallet__history-entry')].at(-1).querySelector('button')).toBeNull();
        await view.unmount();
    });

    it('confirms a copy on the button and to screen readers, for a moment', async () => {
        vi.useFakeTimers();
        try {
            const view = await render();
            const copy = () => view.container.querySelector<HTMLButtonElement>('.wallet__history-entry .wallet__history-copy');
            await act(() => copy().click());
            expect(copy().className).toContain('icon-check');
            expect(copy().getAttribute('aria-label')).toBe('Copied to clipboard');
            expect(view.container.querySelector('[role="status"] .visually-hidden').textContent).toBe('Copied to clipboard');
            await act(() => vi.advanceTimersByTime(2000));
            expect(copy().className).toContain('icon-docs');
            expect(view.container.querySelector('[role="status"] .visually-hidden')).toBeNull();
            await view.unmount();
        }
        finally {
            vi.useRealTimers();
        }
    });

    it('loads older rows on request, ignoring a second press while they load, and gives the first new row the focus', async () => {
        const view = await render({ entries: ENTRIES.slice(0, 2), more: 6 });
        expect(view.button('Show older (6)')).toBeDefined();
        await act(() => view.button('Show older (6)').click());
        expect(view.handlers.onMore).toHaveBeenCalledTimes(1);

        await view.rerender({ entries: ENTRIES.slice(0, 2), more: 6, pending: true });
        const busy = view.button('Show older (6)');
        // Still focusable, so the keyboard focus stays on it
        expect(busy.disabled).toBe(false);
        expect(busy.getAttribute('aria-disabled')).toBe('true');
        await act(() => busy.click());
        expect(view.handlers.onMore).toHaveBeenCalledTimes(1);

        await view.rerender({ entries: ENTRIES, more: 0, pending: false });
        expect(document.activeElement).toBe(view.container.querySelectorAll('.wallet__history-entry')[2]);
        expect(view.button('Show older (6)')).toBeUndefined();
        await view.unmount();
    });

    it('switches filter, and says which transfers it cannot list except among fees', async () => {
        const transfers = await render();
        expect(transfers.button('Fees').getAttribute('aria-pressed')).toBe('false');
        expect(transfers.button('Activity').getAttribute('aria-pressed')).toBe('true');
        await act(() => transfers.button('Fees').click());
        expect(transfers.handlers.onFilter).toHaveBeenCalledWith('fees');
        expect(transfers.container.textContent).toContain('UTXO transfers between accounts, sent or received, are not listed');
        await transfers.unmount();
        const fees = await render({ filter: 'fees' });
        expect(fees.container.textContent).not.toContain('UTXO transfers between accounts');
        await fees.unmount();
    });

    it('shows loading, an empty list for the filter, and the history\'s own error with a way to try again', async () => {
        const loading = await render({ entries: null, pending: true });
        expect(loading.container.textContent).toContain('Loading history…');
        await loading.unmount();
        const empty = await render({ entries: [], filter: 'fees' });
        expect(empty.container.textContent).toContain('No fees yet.');
        await empty.unmount();

        const failed = await render({ entries: null, error: 'E_OFFLINE' });
        expect(failed.container.querySelector('.alert-danger').textContent).toContain('Could not reach the node to load the history.');
        await act(() => failed.button('Try again').click());
        expect(failed.handlers.onFilter).toHaveBeenCalledWith('transfers');
        await failed.unmount();

        // Loading more failed: the rows shown stay, under a warning (an unknown code reads as
        // E_SERVER), and trying again loads the older rows, not the first page over them
        const stale = await render({ error: 'E_SOMETHING', more: 3 });
        expect(stale.rows()).toHaveLength(ENTRIES.length);
        expect(stale.container.querySelector('.alert-warning').textContent).toContain('The node reported an error while loading the history.');
        await act(() => stale.button('Try again').click());
        expect(stale.handlers.onMore).toHaveBeenCalledTimes(1);
        expect(stale.handlers.onFilter).not.toHaveBeenCalled();
        // The alert holding the button goes away: the focus goes to the heading
        expect(document.activeElement).toBe(stale.container.querySelector('h2'));
        await stale.unmount();
    });

    it('reads in Chinese', async () => {
        const view = await render({}, 'zh-CN');
        expect(view.rows().map(row => row.what)).toEqual([
            '转入 UTXO 余额', '转给 0970-5013-8387-9381-1999', '收到 0813-4574-2329-7730-4517 的转账',
            '向 0710-7522-6000-5358-8199 支付手续费', '转给自己', '向自己支付手续费', '已燃烧', '账户已创建', '账户已创建'
        ]);
        await view.unmount();
    });
});
