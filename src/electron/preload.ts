/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Runs sandboxed, before the page: the only bridge between the page and the main process.
// Bundled into a single CommonJS file (vite.electron.config.ts), as sandboxed preloads require.
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IDesktopBridge, IDesktopWindowState } from 'ibax/gui';
import { CHANNELS } from './channels';

const bridge: IDesktopBridge = {
    platform: process.platform,
    args: ipcRenderer.sendSync(CHANNELS.getArgs) || {},
    takeLaunchKey: () => ipcRenderer.sendSync(CHANNELS.takeLaunchKey),
    loadState: () => ipcRenderer.sendSync(CHANNELS.getState),
    // Synchronous, so a save made while the page closes (quitting) is on disk before it goes
    saveState: state => ipcRenderer.sendSync(CHANNELS.setState, state),
    getWindowState: () => ipcRenderer.invoke(CHANNELS.getWindowState),
    onWindowState: listener => {
        const handler = (_event: IpcRendererEvent, state: IDesktopWindowState) => listener(state);
        ipcRenderer.on(CHANNELS.windowState, handler);
        return () => {
            ipcRenderer.removeListener(CHANNELS.windowState, handler);
        };
    },
    minimizeWindow: () => ipcRenderer.send(CHANNELS.minimizeWindow),
    toggleMaximizeWindow: () => ipcRenderer.send(CHANNELS.toggleMaximizeWindow),
    toggleFullScreen: () => ipcRenderer.send(CHANNELS.toggleFullScreen),
    closeWindow: () => ipcRenderer.send(CHANNELS.closeWindow),
    openDevTools: () => ipcRenderer.send(CHANNELS.openDevTools),
    setBadgeCount: count => ipcRenderer.send(CHANNELS.setBadgeCount, count),
    openExternal: url => ipcRenderer.send(CHANNELS.openExternal, url)
};

contextBridge.exposeInMainWorld('weaverDesktop', bridge);
