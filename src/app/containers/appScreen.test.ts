/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { IRootState } from 'modules';
import mockState from 'test/mockStore';
import { selectScreen } from './appScreen';

const stateWith = (engine: Partial<IRootState['engine']>, auth: Partial<IRootState['auth']> = {}) =>
    ({ ...mockState, engine: { ...mockState.engine, ...engine }, auth: { ...mockState.auth, ...auth } } as IRootState);

const signedIn = { isAuthenticated: true, isAcquired: true, sessionRetryReason: null } as const;

describe('selectScreen', () => {
    it('shows the error page on a fatal error, whatever else holds', () => {
        expect(selectScreen(stateWith({ fatalError: { name: 'INITIALIZE_FAILED', message: '' }, isLoaded: true }, signedIn))).toBe('error');
    });

    it('shows the splash until the app is loaded', () => {
        expect(selectScreen(stateWith({ fatalError: null, isLoaded: false }, signedIn))).toBe('splash');
    });

    it('shows the sign-in page to nobody signed in', () => {
        expect(selectScreen(stateWith({ fatalError: null, isLoaded: true }, { isAuthenticated: false }))).toBe('auth');
    });

    it('shows the splash while a restored session is being opened, the retry page while the node does not answer', () => {
        const restoring = { isAuthenticated: true, isAcquired: false };
        expect(selectScreen(stateWith({ fatalError: null, isLoaded: true }, { ...restoring, sessionRetryReason: null }))).toBe('splash');
        expect(selectScreen(stateWith({ fatalError: null, isLoaded: true }, { ...restoring, sessionRetryReason: 'E_OFFLINE' }))).toBe('retry');
        expect(selectScreen(stateWith({ fatalError: null, isLoaded: true }, { ...restoring, sessionRetryReason: 'E_UPDATING' }))).toBe('retry');
    });

    it('shows the app once the session is open', () => {
        expect(selectScreen(stateWith({ fatalError: null, isLoaded: true }, signedIn))).toBe('main');
    });
});
