/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { isAppNavigation, isExternalUrlAllowed } from './navigation';

describe('electron navigation guards', () => {
    it('opens only web links externally', () => {
        expect(isExternalUrlAllowed('https://ibax.io')).toBe(true);
        expect(isExternalUrlAllowed('http://127.0.0.1:7079/api')).toBe(true);
        expect(isExternalUrlAllowed('file:///etc/passwd')).toBe(false);
        expect(isExternalUrlAllowed('smb://attacker/share')).toBe(false);
        expect(isExternalUrlAllowed('javascript:alert(1)')).toBe(false);
        expect(isExternalUrlAllowed('not a url')).toBe(false);
    });

    it('keeps the window on the app page only', () => {
        const prod = 'file:///Applications/Weaver.app/Contents/Resources/app.asar/index.html';
        expect(isAppNavigation(prod + '#/wallet', prod)).toBe(true);
        expect(isAppNavigation('file:///tmp/evil.html', prod)).toBe(false);
        expect(isAppNavigation('https://evil.example/index.html', prod)).toBe(false);

        const dev = 'http://127.0.0.1:3000';
        expect(isAppNavigation('http://127.0.0.1:3000/', dev)).toBe(true);
        expect(isAppNavigation('http://127.0.0.1:3001/', dev)).toBe(false);
    });
});
