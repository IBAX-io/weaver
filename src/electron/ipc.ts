/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The main-process side of the preload bridge (preload.ts). Every message is accepted only from
// the app page itself, and every argument is checked here, not trusted from the page.
import { app, BrowserWindow, ipcMain, IpcMainEvent, shell } from 'electron';
import { CHANNELS } from './channels';
import config from './config';
import args from './args';
import { appUrl } from './appUrl';
import { isAppNavigation, isExternalUrlAllowed } from './util/navigation';
import { windowState } from './util/windowState';

const SAVE_INTERVAL = 1000;

const fromApp = (event: IpcMainEvent) => !!event.senderFrame && isAppNavigation(event.senderFrame.url, appUrl);

const handle = (channel: string, handler: (event: IpcMainEvent, ...values: unknown[]) => void) => {
    ipcMain.on(channel, (event, ...values) => {
        if (!fromApp(event)) {
            event.returnValue = null;
            return;
        }
        handler(event, ...values);
    });
};

const senderWindow = (event: IpcMainEvent) => BrowserWindow.fromWebContents(event.sender);

// The page decides what is persisted (lib/persistence); here it is only stored, at most once
// per SAVE_INTERVAL (--dry stores it in a throwaway profile, see profile.ts)
let pendingState: string | null = null;
let saveTimer: NodeJS.Timeout | null = null;
const flushState = () => {
    saveTimer = null;
    if (null !== pendingState) {
        config.set('persistentData', pendingState);
        pendingState = null;
    }
};
app.on('before-quit', flushState);

handle(CHANNELS.getArgs, event => {
    event.returnValue = args;
});

handle(CHANNELS.getState, event => {
    const stored = pendingState ?? config.get('persistentData');
    try {
        event.returnValue = stored ? JSON.parse(stored) : null;
    }
    catch {
        event.returnValue = null;
    }
});

handle(CHANNELS.setState, (_event, state) => {
    pendingState = JSON.stringify(state ?? null);
    saveTimer = saveTimer || setTimeout(flushState, SAVE_INTERVAL);
});

handle(CHANNELS.getWindowState, event => {
    const window = senderWindow(event);
    event.returnValue = window ? windowState(window) : null;
});

handle(CHANNELS.minimizeWindow, event => senderWindow(event)?.minimize());

handle(CHANNELS.toggleMaximizeWindow, event => {
    const window = senderWindow(event);
    if (window) {
        if (window.isMaximized()) {
            window.unmaximize();
        }
        else {
            window.maximize();
        }
    }
});

handle(CHANNELS.toggleFullScreen, event => {
    const window = senderWindow(event);
    window?.setFullScreen(!window.isFullScreen());
});

handle(CHANNELS.closeWindow, event => senderWindow(event)?.close());

handle(CHANNELS.openDevTools, event => event.sender.openDevTools({ mode: 'detach' }));

handle(CHANNELS.setBadgeCount, (_event, count) => {
    if (Number.isSafeInteger(count) && (count as number) >= 0) {
        app.setBadgeCount(count as number);
    }
});

handle(CHANNELS.openExternal, (_event, url) => {
    if (typeof url === 'string' && isExternalUrlAllowed(url)) {
        shell.openExternal(url);
    }
});
