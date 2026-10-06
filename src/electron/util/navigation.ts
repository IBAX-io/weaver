/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Keep the window on the app page (the bridge in preload.ts answers only that page), and only
// hand web links to the OS browser.

const parse = (value: string | null | undefined) => {
    try {
        return value ? new URL(value) : null;
    }
    catch {
        return null;
    }
};

const WEB_PROTOCOLS = ['http:', 'https:'];

export const hasProtocol = (target: string | null | undefined, protocols: string[]) => {
    const parsed = parse(target);
    return !!parsed && protocols.includes(parsed.protocol);
};

export const isHttpUrl = (target: string | null | undefined) => hasProtocol(target, WEB_PROTOCOLS);

// Web links are opened by the OS browser; anything else (file:, smb:, javascript:, custom
// protocols that start other programs) is not opened at all
export const isExternalUrlAllowed = isHttpUrl;

// A server on this machine (the Vite dev server)
export const isLoopbackUrl = (target: string | null | undefined) => {
    const parsed = parse(target);
    return !!parsed && WEB_PROTOCOLS.includes(parsed.protocol) && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
};

// Same document as the app (ignoring hash/query), e.g. a dev-server reload or file:// index.html
export const isAppNavigation = (target: string | null | undefined, appUrl: string) => {
    const to = parse(target);
    const app = parse(appUrl);
    return !!to && !!app && to.protocol === app.protocol && to.host === app.host && to.pathname === app.pathname;
};

// The bridge answers the app page only: not a subframe's or another document's messages
export const isTrustedSender = (sender: { url: string; isMainFrame: boolean } | null | undefined, appUrl: string) =>
    !!sender && sender.isMainFrame && isAppNavigation(sender.url, appUrl);
