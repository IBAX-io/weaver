/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { fetchNotifications } from 'modules/content/actions';
import { notificationsReceived, setNotificationsCount } from '../actions';
import notificationsEpic from './notificationsEpic';

const context = { wallet: { id: '7' }, access: { ecosystem: '1' }, role: { id: '2' } };

const state = (isAuthenticated = true, notifications = [{ id: '7', ecosystem: '1', role: '0', count: 1 }]) => ({
    ...mockState,
    auth: { ...mockState.auth, isAuthenticated, wallet: context },
    socket: { ...mockState.socket, notifications }
} as unknown as IRootState);

describe('notificationsEpic', () => {
    it('sets the signed-in account\'s counts, and fetches its notifications when the count shown changed', async () => {
        const out = await runEpic(notificationsEpic, [notificationsReceived([
            { ecosystem: '1', role_id: '0', count: 1 },
            { ecosystem: '1', role_id: '2', count: 3 }
        ])], state());
        expect(out).toEqual([
            setNotificationsCount({ id: '7', ecosystem: '1', role: '0', count: 1 }),
            setNotificationsCount({ id: '7', ecosystem: '1', role: '2', count: 3 }),
            fetchNotifications.started(undefined)
        ]);
    });

    it('does not fetch for counts the session does not show', async () => {
        const out = await runEpic(notificationsEpic, [notificationsReceived([{ ecosystem: '1', role_id: '5', count: 4 }])], state());
        expect(out).toEqual([setNotificationsCount({ id: '7', ecosystem: '1', role: '5', count: 4 })]);
    });

    it('ignores publications once signed out', async () => {
        expect(await runEpic(notificationsEpic, [notificationsReceived([{ ecosystem: '1', role_id: '0', count: 4 }])], state(false))).toEqual([]);
    });
});
