/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './profile';
import { app, session } from 'electron';
import { spawnWindow, window } from './windows/index';
import './ipc';

app.whenReady().then(() => {
    // The app needs no camera, microphone, location, notifications or the like
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    // Downloads are the app's own exports (lib/fs sendAttachment: a blob it made); a page or a
    // link cannot make the app fetch and save anything else
    session.defaultSession.on('will-download', (event, item) => {
        if (!item.getURL().startsWith('blob:')) {
            event.preventDefault();
        }
    });
    spawnWindow();
});

// Started again: show the window that is already open (profile.ts)
app.on('second-instance', () => {
    if (window) {
        if (window.isMinimized()) {
            window.restore();
        }
        window.focus();
    }
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
