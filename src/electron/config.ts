/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const Store = require('electron-store');

export default new Store({
    cwd: process.platform === 'win32' ? process.cwd() : undefined
});
