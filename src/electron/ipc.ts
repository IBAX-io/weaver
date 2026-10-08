/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The main-process side of the preload bridge (preload.ts). Every message is accepted only from
// the app page itself, and every argument is checked here, not trusted from the page.
import { app, BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { CHANNELS } from './channels';
import config, { PERSISTED_STATE_KEY } from './config';
import args, { pageArguments } from './args';
import { appUrl } from './appUrl';
import { isTrustedSender } from './util/navigation';
import { openExternalIfAllowed } from './util/openExternal';
import { windowState } from './util/windowState';

// The persisted state holds settings and encrypted wallets; anything larger is not from the app
const MAX_STATE_BYTES = 1024 * 1024;

// The main frame is the one without a parent (WebFrameMain objects are not compared by identity)
const fromApp = (event: IpcMainEvent | IpcMainInvokeEvent) => isTrustedSender(
    event.senderFrame && { url: event.senderFrame.url, isMainFrame: null === event.senderFrame.parent },
    appUrl
);

const handle = (channel: string, handler: (event: IpcMainEvent, ...values: unknown[]) => void) => {
    ipcMain.on(channel, (event, ...values) => {
        if (!fromApp(event)) {
            event.returnValue = null;
            return;
        }
        handler(event, ...values);
    });
};

const senderWindow = (event: IpcMainEvent | IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender);

// Handed to the page once, then forgotten
let launchKey = args.privateKey || null;

handle(CHANNELS.getArgs, event => {
    event.returnValue = { ...pageArguments(args), devTools: !app.isPackaged };
});

handle(CHANNELS.takeLaunchKey, event => {
    event.returnValue = launchKey;
    launchKey = null;
});

handle(CHANNELS.getState, event => {
    const stored = config.get(PERSISTED_STATE_KEY);
    try {
        event.returnValue = stored ? JSON.parse(stored) : null;
    }
    catch {
        event.returnValue = null;
    }
});

// The page decides what is persisted and how often (lib/persistence) and sends it synchronously,
// flushing when it is hidden or closed; each message is on disk before the page continues
handle(CHANNELS.setState, (event, state) => {
    event.returnValue = null;
    let serialized: string;
    try {
        serialized = JSON.stringify(state ?? null);
    }
    catch {
        return;
    }
    if (Buffer.byteLength(serialized) > MAX_STATE_BYTES) {
        console.error(`App state of ${Buffer.byteLength(serialized)} bytes not saved: more than ${MAX_STATE_BYTES}`);
        return;
    }
    // A failed write is logged by the store; the app keeps working with the state in memory
    config.set(PERSISTED_STATE_KEY, serialized);
});

ipcMain.handle(CHANNELS.getWindowState, event => {
    const window = senderWindow(event);
    return fromApp(event) && window ? windowState(window) : null;
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

handle(CHANNELS.openDevTools, event => {
    if (!app.isPackaged) {
        event.sender.openDevTools({ mode: 'detach' });
    }
});

handle(CHANNELS.setBadgeCount, (_event, count) => {
    if ('number' === typeof count && Number.isSafeInteger(count) && count >= 0) {
        app.setBadgeCount(count);
    }
});

handle(CHANNELS.openExternal, (_event, url) => {
    if ('string' === typeof url) {
        openExternalIfAllowed(url);
    }
});
