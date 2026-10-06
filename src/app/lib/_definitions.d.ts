/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare namespace Electron {
    interface BrowserWindow {
        isFocused(): boolean;
        [key: string]: any;
    }
    const ipcRenderer: any;
}
declare module 'electron' {
    export const ipcRenderer: any;
    export const ipcMain: any;
    export const shell: any;
    export const app: any;
    export class BrowserWindow { [key: string]: any; constructor(...args: any[]); }
    export const Menu: any;
    export const dialog: any;
    export const session: any;
    export const screen: any;
    export type Event = any;
    export type Rectangle = any;
    export type MenuItemConstructorOptions = any;
}
declare module 'react-dom';
declare module 'jsrsasign';
declare module 'react-router-transition';
declare module 'html2json';
declare module 'react-contenteditable';
declare module 'classnames' {
    const classNames: (...args: any[]) => string;
    export default classNames;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.json' {
    const content: any;
    export default content;
}

declare module '@electron/remote' {
    export function getCurrentWindow(): any;
    export function getCurrentWebContents(): any;
    export function getGlobal(name: string): any;
    export function getBuiltin(name: string): any;
    export function createFunctionWithReturnValue(returnValue: any): any;
    const _default: any;
    export default _default;
}

declare module '@electron/remote/main' {
    export const initialize: any;
    export const enable: any;
    export const isInitialized: any;
}