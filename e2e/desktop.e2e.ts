/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Starts the built desktop app (npm run build-desktop) on a throwaway profile (--dry) and checks
// the security boundary and the bridge from the page's side, the way users run it.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { _electron, ElectronApplication, Page } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { IDesktopBridge } from 'ibax/gui';

// What page.evaluate callbacks see (they run in the page, so types only)
declare global {
    interface Window {
        weaverDesktop: IDesktopBridge;
    }
}

const BUILD_DIR = fileURLToPath(new URL('../build', import.meta.url));

// Where the profile keeps what the user did: stored state with the wallets, and page storage
const USER_DATA = ['config.json', 'Local Storage', 'IndexedDB', 'Session Storage', 'Cookies', 'WebStorage'];

describe('desktop app', () => {
    let app: ElectronApplication;
    let page: Page;

    beforeAll(async () => {
        // Without executablePath Playwright starts the project's electron (node_modules/electron)
        app = await _electron.launch({ args: [BUILD_DIR, '--dry'] });
        page = await app.firstWindow();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('#root > *');
    }, 60000);

    afterAll(async () => {
        await app?.close();
    });

    it('loads the built page in a sandboxed, isolated renderer', async () => {
        const prefs = await app.evaluate(({ BrowserWindow }) => {
            const contents = BrowserWindow.getAllWindows()[0].webContents;
            return { url: contents.getURL() };
        });
        expect(prefs.url).toMatch(/^file:.*\/build\/index\.html$/);

        // No Node or Electron in the page
        expect(await page.evaluate(() => ['require', 'process', 'module', 'electron'].filter(name => name in window))).toEqual([]);
    });

    it('exposes exactly the bridge, frozen', async () => {
        const bridge = await page.evaluate(() => {
            const desktop = window.weaverDesktop;
            const before = desktop.openExternal;
            try {
                (desktop as { openExternal: unknown }).openExternal = () => 'hijacked';
            }
            catch (e) {
                // frozen in strict mode
            }
            return { keys: Object.keys(desktop).sort(), platform: desktop.platform, dry: desktop.args.dry, intact: desktop.openExternal === before };
        });
        expect(bridge.keys).toEqual([
            'args', 'closeWindow', 'getWindowState', 'loadState', 'minimizeWindow', 'onWindowState', 'openDevTools',
            'openExternal', 'platform', 'saveState', 'setBadgeCount', 'toggleFullScreen', 'toggleMaximizeWindow'
        ]);
        expect(bridge.platform).toBe(process.platform);
        expect(bridge.dry).toBe(true);
        expect(bridge.intact).toBe(true);
    });

    it('draws the window controls and drives the window through the bridge', async () => {
        await page.waitForSelector('.window-controls');
        const maximized = () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMaximized());
        const before = await maximized();

        const reported = page.evaluate(() => new Promise<boolean>(resolve => {
            const stop = window.weaverDesktop.onWindowState(state => {
                stop();
                resolve(state.maximized);
            });
            window.weaverDesktop.toggleMaximizeWindow();
        }));

        expect(await reported).toBe(!before);
        expect(await maximized()).toBe(!before);
        expect(await page.evaluate(() => window.weaverDesktop.getWindowState().maximized)).toBe(!before);
    });

    it('opens only web links outside the app', async () => {
        await app.evaluate(({ shell }) => {
            const opened: string[] = [];
            (globalThis as { __opened?: string[] }).__opened = opened;
            shell.openExternal = async (url: string) => {
                opened.push(url);
            };
        });
        await page.evaluate(() => {
            const desktop = window.weaverDesktop;
            desktop.openExternal('file:///etc/passwd');
            desktop.openExternal('javascript:alert(1)');
            desktop.openExternal('https://ibax.io/');
        });
        await page.waitForTimeout(300);
        expect(await app.evaluate(() => (globalThis as { __opened?: string[] }).__opened)).toEqual(['https://ibax.io/']);
    });

    it('persists the app state through the main process', async () => {
        // The app saves its own state (network, guest session) once it has connected
        const networks = () => page.evaluate(() => {
            const state = window.weaverDesktop.loadState() as { storage?: { networks?: unknown[] } } | null;
            return state?.storage?.networks?.length ?? 0;
        });
        await expect.poll(networks, { timeout: 15000 }).toBeGreaterThan(0);
        const profile = await app.evaluate(({ app: electronApp }) => electronApp.getPath('userData'));

        await expect.poll(() => {
            const file = path.join(profile, 'config.json');
            return existsSync(file) ? JSON.parse(JSON.parse(readFileSync(file, 'utf8')).persistentData) : null;
        }, { timeout: 5000 }).toEqual(await page.evaluate(() => window.weaverDesktop.loadState()));
    });

    it('stays on the app page', async () => {
        await page.evaluate(() => {
            window.location.href = 'https://example.com/';
        });
        await page.waitForTimeout(500);
        expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getURL())).toMatch(/\/build\/index\.html$/);
    });

    // Last: quits the app the way a user does
    it('keeps no user data after a --dry run', async () => {
        const profile = await app.evaluate(({ app: electronApp }) => electronApp.getPath('userData'));
        expect(profile).toMatch(/weaver-dry-/);
        expect(readdirSync(profile)).toContain('config.json');

        const closed = app.waitForEvent('close');
        await app.evaluate(({ app: electronApp }) => electronApp.quit());
        await closed;

        // The app's data is gone; Chromium may still rewrite some of its own metadata (Local State,
        // Preferences, network cache) while shutting down, which the next dry run sweeps away
        const left = existsSync(profile) ? readdirSync(profile) : [];
        expect(left.filter(entry => USER_DATA.includes(entry))).toEqual([]);
    });
});
