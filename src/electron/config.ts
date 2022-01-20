/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ElectronStore from 'electron-store';
const Store: typeof ElectronStore = require('electron-store');

export default new Store({
    cwd: process.platform === 'win32' ? process.cwd() : null
});