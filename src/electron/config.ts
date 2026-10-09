/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { app, Rectangle } from 'electron';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { JsonStore } from './jsonStore';

export const PERSISTED_STATE_KEY = 'persistentData';

interface IConfigSchema {
    // Persisted app state as the page selects it (src/app/lib/persistence), as a JSON string:
    // the format of the config.json Weaver up to 1.4 wrote, which is read as it is
    [PERSISTED_STATE_KEY]: string;
    dimensions: Rectangle;
    maximized: boolean;
    // The PKCS#11 module chosen in the app (pkcs11/service.ts)
    pkcs11Module: string;
}

const file = path.join(app.getPath('userData'), 'config.json');

// Weaver up to 1.4 kept the config in the working directory on Windows (electron-store's cwd);
// bring it over once, only from the installation folder, never from wherever the app was started
const legacyFile = path.join(path.dirname(process.execPath), 'config.json');
if ('win32' === process.platform && !existsSync(file) && existsSync(legacyFile) && path.resolve(process.cwd()) === path.dirname(process.execPath)) {
    copyFileSync(legacyFile, file);
}

export default new JsonStore<IConfigSchema>(file);
