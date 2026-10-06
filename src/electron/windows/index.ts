/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow, Menu } from 'electron';
import menu from '../menu';
import mainWindow from './main';
import { appUrl } from '../appUrl';

export let window: BrowserWindow | null = null;

export const spawnWindow = () => {
    const wnd = mainWindow(appUrl);

    if (window) {
        window.close();
        window.destroy();
    }

    if (process.platform === 'darwin') {
        Menu.setApplicationMenu(menu);
    }

    wnd.loadURL(appUrl);
    wnd.on('closed', () => {
        window = null;
    });
    window = wnd;
};
