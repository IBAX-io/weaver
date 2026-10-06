/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Packages build/ (npm run build-desktop): the page, plus the main process and preload bundled
// with all their dependencies (vite.electron.config.ts) and build/package.json.
/** @type {import('electron-builder').Configuration} */
export default {
    productName: 'Weaver',
    appId: 'space.ibax.weaver',
    extends: null,
    directories: {
        app: 'build',
        output: 'releases'
    },
    files: [
        '**/*',
        '!**/*.map'
    ],
    // Everything the app runs is already bundled: no node_modules to install, rebuild or ship
    // (otherwise electron-builder falls back to the project's node_modules, ~400 MB)
    beforeBuild: async () => false,
    mac: {
        target: 'dmg',
        category: 'public.app-category.developer-tools'
    },
    win: {
        target: 'nsis'
    },
    linux: {
        target: 'AppImage'
    }
};
