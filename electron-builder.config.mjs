/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Packages build/ (npm run build-desktop): the page, plus the main process and preload bundled
// with all their dependencies (vite.electron.config.ts) and build/package.json. koffi's native
// binary (build/koffi) goes outside app.asar, as a native module cannot load from an archive.
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
        '!**/*.map',
        '!koffi/**'
    ],
    // <resources>/koffi/<platform>_<arch>/koffi.node, where the bundled koffi looks for it
    extraResources: [
        { from: 'build/koffi', to: 'koffi', filter: ['**/*.node'] }
    ],
    // Everything the app runs is already bundled: no node_modules to install, rebuild or ship
    // (otherwise electron-builder falls back to the project's node_modules, ~400 MB)
    beforeBuild: async () => false,
    // Electron features the app never uses, turned off in the binary so they cannot be abused:
    // running the executable as plain Node, NODE_OPTIONS, the debugger flags; and the app code
    // is only loaded from the packaged, integrity-checked app.asar. (The file:// privileges stay:
    // the page is served from file:// and fetches its settings and locales from there.)
    electronFuses: {
        runAsNode: false,
        enableNodeOptionsEnvironmentVariable: false,
        enableNodeCliInspectArguments: false,
        enableEmbeddedAsarIntegrityValidation: true,
        onlyLoadAppFromAsar: true,
        // The app keeps no cookies (sessions are tokens in its state), and encrypting them would
        // take a key from the macOS keychain at every start: a blocking password dialog whenever
        // the app's signature changes (every unsigned build)
        enableCookieEncryption: false,
        // Flipping fuses breaks the binary's ad-hoc signature, and Apple Silicon kills unsigned
        // code: re-sign ad-hoc right away (a Developer ID signing afterwards replaces it)
        resetAdHocDarwinSignature: true
    },
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
