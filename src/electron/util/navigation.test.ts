/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { isAppNavigation, isExternalUrlAllowed, isLoopbackUrl, isTrustedSender } from './navigation';

const PROD = 'file:///Applications/Weaver.app/Contents/Resources/app.asar/index.html';
const DEV = 'http://127.0.0.1:3000';

describe('electron navigation guards', () => {
    it('opens only web links externally', () => {
        expect(isExternalUrlAllowed('https://ibax.io')).toBe(true);
        expect(isExternalUrlAllowed('http://127.0.0.1:7079/api')).toBe(true);
        for (const url of ['file:///etc/passwd', 'smb://attacker/share', 'javascript:alert(1)', 'not a url', '', null]) {
            expect([url, isExternalUrlAllowed(url)]).toEqual([url, false]);
        }
    });

    it('keeps the window on the app page only', () => {
        expect(isAppNavigation(PROD + '#/wallet', PROD)).toBe(true);
        expect(isAppNavigation('file:///tmp/evil.html', PROD)).toBe(false);
        expect(isAppNavigation('https://evil.example/index.html', PROD)).toBe(false);
        expect(isAppNavigation('http://127.0.0.1:3000/', DEV)).toBe(true);
        expect(isAppNavigation('http://127.0.0.1:3001/', DEV)).toBe(false);
    });

    it('accepts bridge messages from the app page only (positive control)', () => {
        expect(isTrustedSender({ url: PROD, isMainFrame: true }, PROD)).toBe(true);
        expect(isTrustedSender({ url: DEV + '/', isMainFrame: true }, DEV)).toBe(true);
    });

    it('refuses bridge messages from anything else', () => {
        for (const sender of [
            null,
            undefined,
            { url: PROD, isMainFrame: false },
            { url: 'file:///tmp/evil.html', isMainFrame: true },
            { url: 'https://evil.example/', isMainFrame: true },
            { url: 'data:text/html,<script>1</script>', isMainFrame: true },
            { url: 'about:blank', isMainFrame: true },
            { url: '', isMainFrame: true }
        ]) {
            expect([sender, isTrustedSender(sender, PROD)]).toEqual([sender, false]);
        }
    });

    it('takes a dev server on this machine only', () => {
        expect(isLoopbackUrl('http://127.0.0.1:3000')).toBe(true);
        expect(isLoopbackUrl('http://localhost:5173/')).toBe(true);
        expect(isLoopbackUrl('http://[::1]:3000')).toBe(true);
        for (const url of ['https://evil.example', 'http://127.0.0.1.evil.example', 'file:///index.html', 'http://192.168.1.2:3000', undefined]) {
            expect([url, isLoopbackUrl(url)]).toEqual([url, false]);
        }
    });
});
