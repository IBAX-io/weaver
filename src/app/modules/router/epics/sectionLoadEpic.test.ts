/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import * as routerService from 'services/router';
import { locationChange } from '../actions';
import sectionLoadEpic from './sectionLoadEpic';
import mockState from 'test/mockStore';
import { runEpic } from 'test/runEpic';

describe('sectionLoadEpic', () => {
    it('emits no non-action value when routing throws', async () => {
        const state = {
            ...mockState,
            auth: {
                ...mockState.auth,
                isAcquired: true,
                isAuthenticated: true
            }
        };
        const throwingRouterService: typeof routerService = {
            ...routerService,
            matchRoute: () => { throw new Error('boom'); }
        };
        vi.spyOn(console, 'log').mockImplementation(() => null);

        const emitted = await runEpic(sectionLoadEpic, [
            locationChange({
                ...mockState.router,
                location: { ...mockState.router.location, pathname: '/browse/home' }
            })
        ], state, { routerService: throwingRouterService });

        // An epic must never emit a non-action (e.g. the thrown Error)
        expect(emitted.filter(value => !value || typeof value.type !== 'string')).toEqual([]);
    });
});
