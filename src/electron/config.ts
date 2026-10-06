/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Store from 'electron-store';
import { Rectangle } from 'electron';

interface IConfigSchema {
    // Persisted app state as the page selects it (src/app/lib/persistence), JSON
    persistentData?: string;
    dimensions?: Rectangle;
    maximized?: boolean;
}

export default new Store<IConfigSchema>({
    cwd: process.platform === 'win32' ? process.cwd() : undefined
});
