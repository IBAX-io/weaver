/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'node:path';
import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import config from '../config';
import calcScreenOffset from '../util/calcScreenOffset';
import { isAppNavigation } from '../util/navigation';
import { openExternalIfAllowed } from '../util/openExternal';
import { reportWindowState } from '../util/windowState';

export default (appUrl: string) => {
    const options: BrowserWindowConstructorOptions = {
        minWidth: 800,
        minHeight: 600,
        frame: false,
        backgroundColor: '#244134',
        resizable: true,
        show: false,
        ...calcScreenOffset(config.get('dimensions') || { width: 800, height: 600 }),
        webPreferences: {
            // The page gets no Node or Electron access; preload.ts is the only bridge
            preload: path.join(import.meta.dirname, 'preload.cjs'),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            webviewTag: false,
            // Not in a release: a console that can read the stored wallets invites "paste this here" scams
            devTools: !app.isPackaged
        }
    };

    const window = new BrowserWindow(options);
    if (config.get('maximized')) {
        window.maximize();
    }
    reportWindowState(window);

    window.once('ready-to-show', () => {
        window.show();
    });

    window.on('close', () => {
        config.set('dimensions', window.getNormalBounds());
        config.set('maximized', window.isMaximized());
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
        openExternalIfAllowed(url);
        return { action: 'deny' };
    });

    // The window stays on the app page: links go to the OS browser, redirects and subframe
    // navigations away from it are stopped
    const keepOnApp = (event: { preventDefault: () => void }, url: string) => {
        if (!isAppNavigation(url, appUrl)) {
            event.preventDefault();
            openExternalIfAllowed(url);
        }
    };
    window.webContents.on('will-navigate', (event, url) => keepOnApp(event, url));
    window.webContents.on('will-redirect', (event, url) => keepOnApp(event, url));
    window.webContents.on('will-frame-navigate', event => {
        if (!event.isMainFrame && !isAppNavigation(event.url, appUrl) && !/^(about:blank|data:|blob:)/.test(event.url)) {
            event.preventDefault();
        }
    });

    window.webContents.on('will-attach-webview', event => {
        event.preventDefault();
    });

    return window;
};
