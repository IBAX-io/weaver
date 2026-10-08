/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/gui' {
  // Launch arguments the page sees (src/electron/args.ts)
  interface IInferredArguments {
    readonly fullNode?: string[];
    readonly networkID?: number;
    readonly networkName?: string;
    readonly dry?: boolean;
    readonly socketUrl?: string;
    readonly disableHonorNodesSync?: boolean;
    readonly activationEmail?: string;
    readonly guestMode?: boolean;
    // Developer tools can be opened (not in a release build); set by the main process
    readonly devTools?: boolean;
  }

  // All launch arguments; the rest stay in the main process
  interface ILaunchArguments extends IInferredArguments {
    // --private-key, honoured with --dry only; handed to the page once (takeLaunchKey)
    readonly privateKey?: string;
    readonly offsetX?: number;
    readonly offsetY?: number;
    // Development only: load the page from this local Vite dev server instead of the built files
    readonly devServer?: string;
  }

  interface IDesktopWindowState {
    readonly maximized: boolean;
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
    // The --private-key of a --dry run, once; null afterwards and in normal runs
    takeLaunchKey(): string | null;
    getWindowState(): Promise<IDesktopWindowState>;
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