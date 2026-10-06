/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The renderer runs with nodeIntegration, so whatever page it ends up on gets Node access.
// Keep it on the app page, and only hand web links to the OS browser.

const EXTERNAL_PROTOCOLS = ['http:', 'https:'];

const parse = (value: string) => {
    try {
        return new URL(value);
    }
    catch (e) {
        return null;
    }
};

export const isExternalUrlAllowed = (target: string) => {
    const parsed = parse(target);
    return !!parsed && EXTERNAL_PROTOCOLS.indexOf(parsed.protocol) !== -1;
};

// Same document as the app (ignoring hash/query), e.g. a dev-server reload or file:// index.html
export const isAppNavigation = (target: string, appUrl: string) => {
    const to = parse(target);
    const app = parse(appUrl);
    return !!to && !!app && to.protocol === app.protocol && to.host === app.host && to.pathname === app.pathname;
};
