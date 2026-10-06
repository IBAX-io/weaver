/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/gui' {
  interface IInferredArguments {
    readonly privateKey?: string;
    readonly fullNode?: string[];
    readonly networkID?: number;
    readonly networkName?: string;
    readonly dry?: boolean;
    readonly offsetX?: number;
    readonly offsetY?: number;
    readonly socketUrl?: string;
    readonly disableHonorNodesSync?: boolean;
    readonly activationEmail?: string;
    readonly guestMode?: boolean;
    // Desktop shell only: load the page from this Vite dev server instead of the built files
    readonly devServer?: string;
  }

  interface IDesktopWindowState {
    readonly maximized: boolean;
    readonly fullScreen: boolean;
    readonly focused: boolean;
  }

  // What the desktop app exposes to the page (src/electron/preload.ts, window.weaverDesktop).
  // The page has no Node or Electron access; everything it may do is listed here and checked
  // again in the main process.
  interface IDesktopBridge {
    readonly platform: 'darwin' | 'win32' | 'linux' | (string & {});
    readonly args: IInferredArguments;
    loadState(): unknown;
    saveState(state: unknown): void;
    getWindowState(): IDesktopWindowState;
    // Returns the unsubscribe function
    onWindowState(listener: (state: IDesktopWindowState) => void): () => void;
    minimizeWindow(): void;
    toggleMaximizeWindow(): void;
    toggleFullScreen(): void;
    closeWindow(): void;
    openDevTools(): void;
    setBadgeCount(count: number): void;
    // http(s) only
    openExternal(url: string): void;
  }
}