/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { TUtxoHistoryEntry } from 'modules/wallet/utxoHistory';
import UtxoHistory from './UtxoHistory';
import en from '../../../../../public/locales/en-US.json';
import zh from '../../../../../public/locales/zh-CN.json';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HASH = '7bc57a0270b111a3e74f9824ffb98a6cb37809dbc74ad56ab4a1fb445143004c';
const base = { hash: HASH, blockID: '2545', time: Date.UTC(2023, 4, 22), comment: '', failed: false };
const ENTRIES: TUtxoHistoryEntry[] = [
    { ...base, hash: HASH.replace('7b', '01'), direction: 'in', counterparty: '1634-8099-0439-6342-1518', amount: '100000000000000', comment: 'Rewards of 9th, May. TG winner' },
    { ...base, hash: HASH.replace('7b', '02'), direction: 'out', counterparty: '0404-3454-2329-7827-9010', amount: '200' },
    { ...base, hash: HASH.replace('7b', '03'), direction: 'out', counterparty: '0404-3454-2329-7827-9010', amount: '5', failed: true },
    { ...base, hash: HASH.replace('7b', '04'), direction: 'self', counterparty: null, amount: '7' },
    { hash: HASH.replace('7b', '05'), blockID: '3191', problem: 'unconfirmed' },
    { hash: HASH.replace('7b', '06'), blockID: '3190', problem: 'mismatch' }
];

type TProps = React.ComponentProps<typeof UtxoHistory>;

const render = async (props: Partial<TProps> = {}, locale = 'en-US') => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const handlers = { onRetry: vi.fn(), onMore: vi.fn() };
    const element = (more: Partial<TProps> = {}) => (
        <IntlProvider locale={locale} messages={'zh-CN' === locale ? zh : en} timeZone="UTC">
            <UtxoHistory explorer="testscan.ibax.network:8800" entries={ENTRIES} more={false} checked={34} total={34} incomplete={[]} pending={false} error={null} digits={12} symbol="IBXC" {...handlers} {...props} {...more} />
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
        rerender: (more: Partial<TProps>) => act(() => root.render(element(more))),
        unmount: async () => {
            await act(() => root.unmount());
            container.remove();
        }
    };
};

describe('wallet UTXO transfers', () => {
    it('lists transfers received and sent, a failed one moving nothing, and ones the node does not confirm without an amount', async () => {
        const view = await render();
        expect(view.rows()).toEqual([
            { what: 'Received from 1634-8099-0439-6342-1518', amount: '+100 IBXC' },
            { what: 'Sent to 0404-3454-2329-7827-9010', amount: '−0.0000000002 IBXC' },
            { what: 'Sent to 0404-3454-2329-7827-9010', amount: '0.000000000005 IBXC' },
            { what: 'Sent to yourself', amount: '0.000000000007 IBXC' },
            { what: 'Listed by the block explorer', amount: null },
            { what: 'Listed by the block explorer', amount: null }
        ]);
        expect([...view.container.querySelectorAll('.wallet__history-penalty')].map(badge => badge.textContent)).toEqual([
            'The transaction failed; no transfer took place', 'Not confirmed by the node yet', 'The node records it otherwise: no details shown'
        ]);
        // Nothing the node did not confirm: no counterparty, no time
        const unchecked = [...view.container.querySelectorAll('.wallet__history-entry')].slice(-2);
        expect(unchecked.map(row => row.querySelector('time'))).toEqual([null, null]);
        // The failed one's amount is struck through, and said to have moved nothing
        expect(view.container.querySelectorAll('.wallet__history-amount_void')).toHaveLength(1);
        expect(view.container.querySelector('.wallet__history-comment').textContent).toBe('Note: Rewards of 9th, May. TG winner');
        await view.unmount();
    });

    it('says where the list comes from, which host the address goes to, and what it cannot show', async () => {
        const view = await render();
        const [source, privacy] = [...view.container.querySelectorAll('.card-body > p')].map(p => p.textContent);
        expect(source).toContain('A transfer the explorer does not list is not shown.');
        expect(privacy).toBe('To find them, this account\'s address is sent to testscan.ibax.network:8800.');
        await view.unmount();

        // Blocks that could not be read whole: said in the polite region, without an alert role
        const block = (blockID: string) => ({ blockID, count: 600 });
        const one = await render({ incomplete: [block('1609')] });
        const note = one.container.querySelector('[role="status"] .alert-warning');
        expect(note.textContent).toBe('Block 1609 holds more of the account\'s transactions than the block explorer lists at once, so some transfers in it may be missing.');
        expect(one.container.querySelector('[role="status"] [role="alert"]')).toBeNull();
        await one.unmount();
        const three = await render({ incomplete: [block('1609'), block('1600'), block('1567')] });
        expect(three.container.querySelector('.alert-warning').textContent).toBe('3 blocks, from 1609 to 1567, hold more of the account\'s transactions than the block explorer lists at once, so some transfers in them may be missing. (1609, 1600, 1567)');
        await three.unmount();
        const many = await render({ incomplete: ['1609', '1608', '1607', '1606', '1567'].map(block) });
        expect(many.container.querySelector('.alert-warning details').textContent).toBe('Blocks1609, 1608, 1607, 1606, 1567');
        await many.unmount();
        const zh = await render({ incomplete: [block('1609')] }, 'zh-CN');
        expect(zh.container.querySelector('.alert-warning').textContent).toBe('区块 1609 中该账户的交易超过区块浏览器一次能列出的数量，其中的转账可能有遗漏。');
        await zh.unmount();
    });

    it('looks further back on request, saying how much it looked through, to screen readers too', async () => {
        const view = await render({ more: true, checked: 1000, total: 101758 });
        const checked = view.container.querySelector('[role="status"] #wallet-utxo-checked');
        expect(checked.textContent).toBe('Looked through 1,000 of the account\'s 101,758 transactions in this ecosystem');
        expect(view.button('Look further back').getAttribute('aria-describedby')).toBe('wallet-utxo-checked');
        await act(() => view.button('Look further back').click());
        expect(view.handlers.onMore).toHaveBeenCalledTimes(1);
        // Ignored while it loads
        await view.rerender({ more: true, pending: true, checked: 1000, total: 101758 });
        await act(() => view.button('Look further back').click());
        expect(view.handlers.onMore).toHaveBeenCalledTimes(1);
        await view.unmount();
    });

    it('gives the focus to the first transfer found further back, or keeps it when none was', async () => {
        const view = await render({ entries: ENTRIES.slice(0, 2), more: true });
        await act(() => view.button('Look further back').focus());
        await act(() => view.button('Look further back').click());
        await view.rerender({ entries: ENTRIES.slice(0, 2), more: true, pending: true });
        await view.rerender({ entries: ENTRIES, more: true, pending: false });
        expect(document.activeElement).toBe(view.container.querySelectorAll('.wallet__history-entry')[2]);

        // Nothing new, and nothing more to look through: the button goes, the focus goes to the heading
        await act(() => view.button('Look further back').focus());
        await act(() => view.button('Look further back').click());
        await view.rerender({ entries: ENTRIES, more: true, pending: true });
        await view.rerender({ entries: ENTRIES, more: false, pending: false });
        expect(document.activeElement).toBe(view.container.querySelector('h2'));
        await view.unmount();
    });

    it('says why nothing is shown, and tries again what failed', async () => {
        const noExplorer = await render({ explorer: null, entries: null });
        expect(noExplorer.container.textContent).toContain('This network has no block explorer configured');
        expect(noExplorer.container.textContent).toContain('Keep the transaction hash of the transfers you send.');
        expect(noExplorer.button('Try again')).toBeUndefined();
        await noExplorer.unmount();

        const failed = await render({ entries: null, error: 'E_SERVER' });
        expect(failed.container.querySelector('.alert-danger').textContent).toContain('The block explorer or the node reported an error');
        // The alert announces itself, outside the polite region
        expect(failed.container.querySelector('[role="status"] .alert')).toBeNull();
        await act(() => failed.button('Try again').click());
        expect(failed.handlers.onRetry).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(failed.container.querySelector('h2'));
        await failed.unmount();

        // Loading more failed: the transfers shown stay, under a warning
        const stale = await render({ error: 'E_OFFLINE', more: true });
        expect(stale.rows()).toHaveLength(ENTRIES.length);
        expect(stale.container.querySelector('.alert-warning').textContent).toContain('Could not reach the block explorer or the node');
        await stale.unmount();

        const none = await render({ entries: [], more: false });
        expect(none.container.textContent).toContain('The block explorer lists no UTXO transfers of this account.');
        await none.unmount();
        const noneYet = await render({ entries: [], more: true, checked: 1000, total: 101758 });
        expect(noneYet.container.textContent).toContain('None among the latest 1,000 of the account\'s 101,758 transactions in this ecosystem.');
        // Said once, and what the button goes on from
        expect(noneYet.container.textContent).not.toContain('Looked through');
        expect(noneYet.container.querySelector('#wallet-utxo-checked').textContent).toContain('None among the latest 1,000');
        await noneYet.unmount();
    });

    it('reads in Chinese', async () => {
        const view = await render({ error: 'E_OFFLINE' }, 'zh-CN');
        expect(view.rows().map(row => row.what)).toEqual([
            '收到 1634-8099-0439-6342-1518 的转账', '转给 0404-3454-2329-7827-9010', '转给 0404-3454-2329-7827-9010', '转给自己', '区块浏览器列出的交易', '区块浏览器列出的交易'
        ]);
        expect(view.container.querySelector('h2').textContent).toBe('UTXO 转账');
        expect(view.container.querySelector('.alert').textContent).toContain('无法连接区块浏览器或节点');
        await view.unmount();
        const noExplorer = await render({ explorer: null, entries: null }, 'zh-CN');
        expect(noExplorer.container.textContent).toContain('这个网络没有配置区块浏览器');
        await noExplorer.unmount();
    });
});
