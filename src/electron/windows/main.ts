/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'node:path';
import { BrowserWindow, BrowserWindowConstructorOptions, shell } from 'electron';
import config from '../config';
import calcScreenOffset from '../util/calcScreenOffset';
import { isAppNavigation, isExternalUrlAllowed } from '../util/navigation';
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
            webviewTag: false
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
        if (isExternalUrlAllowed(url)) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    window.webContents.on('will-navigate', (event, url) => {
        if (!isAppNavigation(url, appUrl)) {
            event.preventDefault();
            if (isExternalUrlAllowed(url)) {
                shell.openExternal(url);
            }
        }
    });

    window.webContents.on('will-attach-webview', event => {
        event.preventDefault();
    });

    return window;
};
