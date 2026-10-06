/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow } from 'electron';
import { IDesktopWindowState } from 'ibax/gui';
import { CHANNELS } from '../channels';

export const windowState = (window: BrowserWindow): IDesktopWindowState => ({
    maximized: window.isMaximized(),
    fullScreen: window.isFullScreen(),
    focused: window.isFocused()
});

// Keeps the page's titlebar in sync with the window
export const reportWindowState = (window: BrowserWindow) => {
    const report = () => {
        if (!window.isDestroyed()) {
            window.webContents.send(CHANNELS.windowState, windowState(window));
        }
    };
    for (const event of ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen', 'focus', 'blur'] as const) {
        window.on(event as 'maximize', report);
    }
};
