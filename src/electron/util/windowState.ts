/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow } from 'electron';
import { IDesktopWindowState } from 'ibax/gui';
import { CHANNELS } from '../channels';

export const windowState = (window: BrowserWindow): IDesktopWindowState => ({
    maximized: window.isMaximized(),
    focused: window.isFocused()
});

// Keeps the page's titlebar in sync with the window
export const reportWindowState = (window: BrowserWindow) => {
    const report = () => {
        if (!window.isDestroyed()) {
            window.webContents.send(CHANNELS.windowState, windowState(window));
        }
    };
    window.on('maximize', report);
    window.on('unmaximize', report);
    // Leaving full screen can restore a maximized window without a maximize event (macOS)
    window.on('enter-full-screen', report);
    window.on('leave-full-screen', report);
    window.on('focus', report);
    window.on('blur', report);
};
