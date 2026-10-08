/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The desktop app's bridge (src/electron/preload.ts); null in the browser. The page has no other
// way to reach Electron or Node.
import { IDesktopBridge } from 'ibax/gui';

declare global {
    interface Window {
        weaverDesktop?: IDesktopBridge;
    }
}

const desktop: IDesktopBridge | null = typeof window !== 'undefined' && window.weaverDesktop || null;

export default desktop;
