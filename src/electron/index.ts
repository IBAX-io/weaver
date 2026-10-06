/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './profile';
import { app } from 'electron';
import { spawnWindow, window } from './windows/index';
import './ipc';

app.whenReady().then(() => {
    spawnWindow();
});

app.on('window-all-closed', () => {
    if ('darwin' !== process.platform) {
        app.quit();
    }
});

app.on('activate', () => {
    if (null === window) {
        spawnWindow();
    }
});
