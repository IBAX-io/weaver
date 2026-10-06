/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// IPC channels between the preload bridge and the main process
export const CHANNELS = {
    getArgs: 'weaver:get-args',
    takeLaunchKey: 'weaver:take-launch-key',
    getState: 'weaver:get-state',
    setState: 'weaver:set-state',
    getWindowState: 'weaver:get-window-state',
    windowState: 'weaver:window-state',
    minimizeWindow: 'weaver:minimize-window',
    toggleMaximizeWindow: 'weaver:toggle-maximize-window',
    toggleFullScreen: 'weaver:toggle-full-screen',
    closeWindow: 'weaver:close-window',
    openDevTools: 'weaver:open-dev-tools',
    setBadgeCount: 'weaver:set-badge-count',
    openExternal: 'weaver:open-external'
} as const;
